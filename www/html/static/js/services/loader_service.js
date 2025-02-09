tlcApp.service('loaderService', function ($rootScope) {

    // Init vars
    $rootScope.loadingProcesses = [];
    var observers = [];
    var self = this;


    // Watch for changes on root scope. If changes detected, notify all observers
    $rootScope.$watch('loadingProcesses', function () {
        self._notifyObservers();
    });

    /**
     * Get all processes
     *
     * @return {Object} The processes
     */
    this.getProcesses = function () {
        return $rootScope.loadingProcesses;
    };

    /**
     * Get ui locking processes
     *
     * @return {Object} The processes
     */
    this.getUiLockingProcesses = function () {

        return _.filter($rootScope.loadingProcesses, function (process) {
            return process.lockUi
        });
    };

    /**
     * Add process
     *
     * @param {String} id The unique process id
     * @param {Bool} lockUi Lock the ui, optional, default: true
     * @param {String} message Internal process message, optional
     */
    this.addProcess = function (id, lockUi, message) {

        // Set optional parameter if not defined
        lockUi = typeof lockUi !== 'boolean' ? true : lockUi;
        message = typeof message !== 'string' ? '' : message;

        // Add loadingProcesses
        $rootScope.loadingProcesses.push({
            id: id,
            lockUi: lockUi,
            message: message
        });

        // Notify the observers
        self._notifyObservers();
    };

    /**
     * Remove process
     *
     * @param {String} id The unique process id
     */
    this.removeProcess = function (id) {

        // Remove process with id
        $rootScope.loadingProcesses = _.filter($rootScope.loadingProcesses, function (process) {
            return process.id !== id;
        });

        // Notify the observers
        self._notifyObservers();
    };

    /**
     * Register an observer
     *
     * @param {Function} callback The callback function
     */
    this.registerObserver = function (callback) {
        observers.push(callback);
    };

    /**
     * Notify all observers
     */
    this._notifyObservers = function () {
        angular.forEach(observers, function (callback) {
            callback.apply(self);
        });
    };
});
