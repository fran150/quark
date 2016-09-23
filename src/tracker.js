function Tracker(mainModel) {
    var self = this;

    var childs = {};

    mainModel.ready = $$.lock();
    this.loaded = $$.signal();
    this.readied = $$.signal();

    this.addDependency = function(name) {
        mainModel.ready.lock();

        childs[name] = {
            name: name,
            loaded: false,
            ready: false
        }
    }

    this.loadChild = function(name, model, tracker) {
        childs[name].model = model;

        self.loaded.dispatch(name, model);

        if (tracker) {
            childs[name].ready = false;
            tracker.parent = self;
        } else {
            self.childReady(name, model);
        }

        if (checkReady()) {
            markReadyAndInformParent(model, tracker);
        }
    }

    this.childReady = function(name, model, tracker) {
        childs[name].ready = true;

        mainModel.ready.unlock();

        if (checkReady()) {
            markReadyAndInformParent(model, tracker);
        }
    }

    function checkReady() {
        for (var name in childs) {
            var state = childs[name];
            if (!state.loaded || !state.ready) {
                return false;
            }
        }

        return true;
    }

    function markReadyAndInformParent(name, model, tracker) {
        mainModel.ready.unlock();

        if (tracker) {
            tracker.parent.childReady(name, model, tracker);
        }
    }

    // tracking
    //      childs
    //          [name]
    //              load()
    //              loaded
    //              ready
    //      parent
    //      parentState
    //      childReady

}
