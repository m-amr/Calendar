/**
 * Created by amr on 5/12/17.
 */

(function () {
    //auto focus modal first input
    $('body').on('shown.bs.modal', '#modal-id', function () {
        $('input:visible:enabled:first', this).focus();
    });

    var calendarModule = angular.module('calendarModule', []);

    calendarModule.controller('mainCtl', ['$scope', '$rootScope', 'calenderService', function ($scope, $rootScope, calenderService) {

        var date = new Date();
        $scope.selectedMonth = '' + date.getMonth();
        $scope.selectedYear = date.getFullYear();

        $scope.daysInMonth = calenderService.getDaysInMonthInTableViewFormat(Number($scope.selectedMonth), Number($scope.selectedYear));
        $scope.daysInWeek = calenderService.getDaysInWeek(true);
        $scope.months = calenderService.getMonths();
        $scope.years = calenderService.getYears();

        $scope.isDisabled = function(dateObject){
            return dateObject.month !== Number($scope.selectedMonth);
        };

        $scope.getDayMonthName = function(day){
            return calenderService.getMontName(day.month, true);
        };

        $scope.isToday = function(dateObject){
            var todayDate = new Date();
            return (
                dateObject.day === todayDate.getDate()
                && dateObject.month === todayDate.getMonth()
                && dateObject.year === todayDate.getFullYear()
            );
        };

        $scope.showAllEventClicked = function (dayObject) {
            $rootScope.$broadcast('show:events', dayObject)
        };

        //events
        $scope.monthChanged = function () {
            $scope.daysInMonth = calenderService.getDaysInMonthInTableViewFormat(Number($scope.selectedMonth), Number($scope.selectedYear));
        };

        $scope.yearChanged = function () {
            $scope.daysInMonth = calenderService.getDaysInMonthInTableViewFormat(Number($scope.selectedMonth), Number($scope.selectedYear));
        };

        $scope.addEventClicked = function (dayObject) {
            $rootScope.$broadcast('add:event', dayObject)
        };

    }]);

    calendarModule.controller('modalCtl', ['$scope', 'eventService', function ($scope, eventService) {
        var modalElement = $('#modal-id');
        $scope.eventText = null;
        $scope.dayObject = null;
        $scope.isAddEvent = false;


        $scope.$on('add:event', function (event, dayObject) {
            $scope.resetEventForm();
            $scope.isAddEvent = true;
            $scope.eventText = '';
            $scope.dayObject = dayObject;
            modalElement.modal({
                keyboard: true
            });
        });

        $scope.$on('show:events', function (event, dayObject) {
            $scope.isAddEvent = false;
            $scope.eventText = '';
            $scope.dayObject = dayObject;

            modalElement.modal({
                keyboard: true
            });
        });

        $scope.resetEventForm = function(){
            $scope.eventForm.$setPristine();
            $scope.eventForm.$setUntouched();
        };

        $scope.saveEventClicked = function () {
            if($scope.eventForm.eventName.$valid){
                $scope.dayObject.eventList = eventService.addEventToDay($scope.dayObject, $scope.eventText);
                modalElement.modal('toggle');
            }
        };

        $scope.deleteEventClicked = function(eventIndex){
            $scope.dayObject.eventList.splice(eventIndex, 1);

        };
    }]);

    calendarModule.service('calenderService', ['eventService', function (eventService) {
        var DAYS_IN_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        var DAYS_IN_WEEK_ALIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
            'October', 'November', 'December'];

        var MONTHS_ALIAS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Nov', 'Dec'];

        this.getMontName = function(monthNumber, alias){
            if(alias){
                return MONTHS_ALIAS[monthNumber];
            }

            return MONTHS[monthNumber];
        };

        this.getNumberOfDaysInMonth = function (month, year) {
            var date = new Date(year, month + 1, 0);
            return date.getDate();
        };

        this.getFirstDateInMonth = function (month, year) {
            return new Date(year, month, 1);
        };

        this.getDaysInMonthInTableViewFormat = function (month, year) {
            var numberOfDaysInMonth = this.getNumberOfDaysInMonth(month, year);
            var daysTable = [];
            var rowNum = 0;
            daysTable[rowNum] = [];

            var firstDateInMonth = this.getFirstDateInMonth(month, year);
            var firstDay = firstDateInMonth.getDay();

            if (firstDay !== 0) {
                var lastDayDateInPreviewMonth = this.getNumberOfDaysInMonth(month - 1, year);
                while (firstDay > daysTable[0].length) {
                    daysTable[rowNum].unshift(this.createDayObject(lastDayDateInPreviewMonth, month - 1, year));
                    lastDayDateInPreviewMonth--;
                }
            }

            for (var i = 1; i <= numberOfDaysInMonth; i++) {

                daysTable[rowNum].push(this.createDayObject(i, month, year));
                if (daysTable[rowNum].length % 7 === 0) {
                    rowNum++;
                    daysTable[rowNum] = [];
                }

            }
            var d = 0;
            while (daysTable[rowNum].length < 7) {
                ++d;
                daysTable[rowNum].push(this.createDayObject(d, month + 1, year));
            }

            if (daysTable.length < 6) {
                ++rowNum;
                daysTable[rowNum] = [];
                for (i = 0; i < 7; i++) {
                    ++d;
                    daysTable[rowNum].push(this.createDayObject(d, month + 1, year));
                }
            }

            return daysTable;
        };

        this.createDayObject = function (day, month, year) {
            var date = new Date(year, month, day);
            var dayObject = {
                'day': date.getDate(),
                'month': date.getMonth(),
                'year': date.getFullYear()
            };
            dayObject.eventList = eventService.getEventsInDay(dayObject);
            return dayObject;
        };

        this.getDaysInWeek = function (alias) {
            return alias ? DAYS_IN_WEEK_ALIAS : DAYS_IN_WEEK;
        };

        this.getMonths = function () {
            return MONTHS;
        };

        this.getYears = function () {
            years = [];
            for (var i = 1900; i < 2100; i++) {
                years.push(i);
            }
            return years;
        };
    }]);

    calendarModule.service('eventService', [function () {
        var eventList = {};

        this.addEventToDay = function (dayObject, eventText) {
            var list = this.getEventsInDay(dayObject);
            list.push(eventText);

            return list;
        };

        this.getEventsInDay = function (dayObject) {
            var key = dayObject.day + '.' + dayObject.month + '.' + dayObject.year;
            if (eventList[key] === undefined) {
                eventList[key] = [];
            }

            return eventList[key];

        };
    }]);
})();
