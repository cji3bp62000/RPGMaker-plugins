class EventComponent
{
	_gameEventId = null;
	_coroutineRunners = [];
	
	initVariables = [];
	
	constructor(targetEventId, initParamList) {
		this._gameEventId = targetEventId;
		_initializeVariables(initParamList);
	}
	
	start() { }
	update() { }
	
	static get initVariableNames() {
		return [];
	}

	get gameEvent() {
		return $gameMap.event(this._gameEventId);
	}
	
	getComponent(componentType) {
		return this.gameEvent.getComponent(componentType);
	}
	
	getComponents(componentType) {
		return this.gameEvent.getComponents(componentType);
	}
	
	startCoroutine(iterator) {
		this._coroutineRunners.push(new CoroutineRunner(iterator));
	}
	
	stopCoroutine(iterator) {
		for (let i = this._coroutineRunners.length - 1; i >= 0; i--) {
			if (this._coroutineRunners[i].isRunning(iterator)) {
				this._coroutineRunners.splice(i, 1);
				break;
			}
		}
	}
	
	_initializeVariables(initParamList) {
		let initVariableNames = this.constructor.initVariableNames;
		for (let i = 0; i < initVariableNames.length; i++) {
			if (initParamList[i] !== null) {
				this[initVariableNames[i]] = initParamList[i];
			}
		}
	}
	
	_updateCoroutines() {
		for (let i = 0; i < this._coroutineRunners.length; i++) {
			this._coroutineRunners[i].next();
		}
		for (let i = this._coroutineRunners.length - 1; i >= 0; i--) {
			if (this._coroutineRunners[i].done) {
				this._coroutineRunners.splice(i, 1);
			}
		}
	}
}

class CoroutineRunner
{
	_iterator = null;
	_done = false;
	
	constructor(iterator) {
		this._iterator = iterator ?? null;
	}
	
	next() {
		if (this._iterator == null || _done) {
			return;
		}
		
		let result = this._iterator.next();
		if (result.done) {
			_done = true;
		}
	}
	
	get done() {
		return _done;
	}
	
	isRunning(checkIterator) {
		return this._iterator == checkIterator;
	}
}

/* class CoroutineRunner
class CoroutineRunner {
	
	_currentCoroutine = null;
	_coroutineStack = [];
	
	constructor(iterator) {
		_currentCoroutine = iterator ?? null;
	}
	
	next() {
		if (_currentCoroutine == null) {
			return;
		}
		
		let result = _currentCoroutine.next();
		if (result.value != null) {
			_coroutineStack.push(_currentCoroutine);
			_currentCoroutine = result.value;
		}
		else if (result.done) {
			_currentCoroutine = _coroutineStack.pop();
			if (_currentCoroutine == undefined) {
				_currentCoroutine = null;
			}
		}
	}
	
	get done() {
		return _currentCoroutine == null && _coroutineStack.length == 0;
	}
}
*/

function* WaitForFrames(durationFrame = 0) {
	let currentFrame = 0;
	while (currentFrame < durationFrame) {
		currentFrame++;
		yield null;
	}
};

function* WaitForSeconds(durationSec = 0) {
	let currentTime = UpdateTime.time;
	let durationMSec = durationSec * 1000;
	while (UpdateTime.time - currentTime < durationMSec) yield null;
};

function* WaitForMapSeconds(durationSec = 0) {
	let currentMapTime = UpdateTime.mapTime;
	let durationMSec = durationSec * 1000;
	while (UpdateTime.mapTime - currentMapTime < durationMSec) yield null;
};

function* WaitWhile(checkFunc) {
	while (checkFunc()) yield null;
};

function* WaitUntil(checkFunc) {
	while (!checkFunc()) yield null;
};

class UpdateTime {
	static _totalTime = 0;
	static _lastTime = 0;
	static _deltaTime = 0;

	static _totalMapTime = 0;

	static _isFreezeOneDeltaTime = false;
	
	static get time() {
		return this._totalTime;
	}

	static get mapTime() {
		return this._totalMapTime;
	}
	
	static get deltaTime() {
		return this._deltaTime;
	}
	
	static initialize() {
		this._lastTime = Date.now();
	}
	
	static resetTime() {
		this._totalTime = 0;
		this._totalMapTime = 0;
	}
	
	static resetMapTime() {
		this._totalMapTime = 0;
	}
	
	static updateElapsed() {
		let nowTime = Date.now();
		if (this._isFreezeOneDeltaTime) {
			this._isFreezeOneDeltaTime = false;
		} else {
			this._deltaTime = nowTime - this._lastTime;
		}
		this._lastTime = nowTime;
		this._totalTime += this._deltaTime;
	}
	
	static updateElapsedOnMap() {
		this._totalMapTime += this._deltaTime;
	}

	static freezeNextDeltaTimeUpdate() {
		this._isFreezeOneDeltaTime = true;
	}
}

/*
 * 既存関数の書き換え
 */
(function() {
	"use strict";

	//=================================
	// Scene
	// UpdateTimeをアップデートする。
	//=================================
	let _SceneManager_initialize = SceneManager.initialize;
	SceneManager.initialize = function() {
		_SceneManager_initialize.apply(this, arguments);
		UpdateTime.initialize();
	};
	
	let _Scene_Base_update = Scene_Base.prototype.update;
	Scene_Base.prototype.update = function() {
		_Scene_Base_update.apply(this, arguments);
	};

	Scene_Base.prototype.updateUpdateTime = function() {
		UpdateTime.updateElapsed();
	}
	
	Scene_Map.prototype.updateUpdateTime = function() {
		UpdateTime.updateElapsed();
		UpdateTime.updateElapsedOnMap();
	};
	
	//=================================
	// Game_Event
	// EventComponentに関連する拡張関数を定義します。
	//=================================
	
	let _Game_Event_initialize = Game_Event.prototype.initialize;
	Game_Event.prototype.initialize = function(mapId, eventId) {
		_Game_Event_initialize.apply(this, arguments);
		this._eventComponents = [];
		this.setupEventComponents();
	};
	
	Game_Event.prototype.setupEventComponents = function() {
		if (this.event().metaArray == null) return;
		var ecArray = this.event().metaArray.EventComponent || this.event().metaArray.EC;
		if (!ecArray) return;
	
		for (let i = 0; i < ecArray.length; i++) {
			let contents = ecArray[i].split(",");
			let componentName = contents.shift();
			let componentClass = window[componentName];
	
			if (!(componentClass instanceof EventComponent)) {
				console.warn("can't create component " + componentName + " for event #"
				+ this._eventId + "; class is not an EventComponent.");
				continue;
			}
			
			let initParams = [];
			try {
				let startParamsString = "[" + contents.join(",") + "]";
				initParams = JSON.parse(startParamsString);
			} catch(e) {
				console.error("can't parse" + componentName + "'s parameter for event #" + this._eventId + "for " + componentName);
				console.error(e);
				continue;
			}
	
			try {
				let newComponent = new componentClass(this._eventId, initParams);
				this._eventComponents.push(newComponent);
			} catch(e) {
				console.warn("can't create component " + componentName + " for event #" + this._eventId);
				console.error(e);
				continue;
			}
		}
	};
	
	let _Game_Event_update = Game_Event.prototype.update;
	Game_Event.prototype.update = function() {
		_Game_Event_update.apply(this, arguments);
		this.updateEventComponents();
	};
	
	Game_Event.prototype.updateEventComponents = function() {
		for (let i = 0; i < this._eventComponents.length; i++) {
			this._eventComponents[i].update();
			this._eventComponents[i]._updateCoroutines();
		}
	};
	
	Game_Event.prototype.getComponent = function(componentType) {
		for (let i = 0; i < this._eventComponents.length; i++) {
			if (this._eventComponents[i] instanceof componentType) return this._eventComponents[i];
		}
		return null;
	};
	
	Game_Event.prototype.getComponents = function(componentType) {
		targetComponents = [];
		for (let i = 0; i < this._eventComponents.length; i++) {
			if (this._eventComponents[i] instanceof componentType) targetComponents.push(this._eventComponents[i]);
		}
		return targetComponents;
	};
	
	Game_Event.prototype.callComponentOnSceneStart = function() {
		if (this._eventComponents == null) return;
		
		for (let i = 0; i < this._eventComponents.length; i++) {
			if (this._eventComponents[i].onSceneStart instanceof Function)
				this._eventComponents[i].onSceneStart();
		}
	};
	
	Game_Event.prototype.callComponentStart = function() {
		if (this._eventComponents == null) return;
		
		for (let i = 0; i < this._eventComponents.length; i++) {
			if (this._eventComponents[i].start instanceof Function) {
				this._eventComponents[i].start();
			}
		}
	};
	
	Game_Event.prototype.callComponentOnLoadFromSaveContents = function() {
		if (this._eventComponents == null) return;
		
		for (var i = 0; i < this._eventComponents.length; i++) {
			if (this._eventComponents[i].onLoadFromSaveContents instanceof Function)
				this._eventComponents[i].onLoadFromSaveContents();
		}
	};
	
	//=================================
	// DataManager
	// 拡張する関数を定義します。
	//=================================
	
	let _DataManager_extractSaveContents = DataManager.extractSaveContents;
	DataManager.extractSaveContents = function(contents) {
		_DataManager_extractSaveContents.call(this, contents);
		let es = contents.map.events();
		if (!es) return;
		es.forEach(function(e) {
			e.callComponentOnLoadFromSaveContents();
		});
	};
	
	/* (C) 2015-2017 Triacontane.
	 * Released under the MIT license
	 * https://opensource.org/licenses/mit-license.php
	 */
	if (!DataManager.extractMetadataArray) {
		var _DataManager_extractMetadata = DataManager.extractMetadata;
		DataManager.extractMetadata = function(data) {
			_DataManager_extractMetadata.apply(this, arguments);
			this.extractMetadataArray(data);
		};
			DataManager.extractMetadataArray = function(data) {
			var re = /<([^<>:]+)(:?)([^>]*)>/g;
			data.metaArray = {};
			var match = true;
			while (match) {
				match = re.exec(data.note);
				if (match) {
					var metaName = match[1];
					data.metaArray[metaName] = data.metaArray[metaName] || [];
					data.metaArray[metaName].push(match[2] === ':' ? match[3] : true);
				}
			}
		};
	}
	
	//=================================
	// Game_Map
	// 拡張する関数を定義します。
	//=================================
	
	let _Game_Map_setup = Game_Map.prototype.setup;
	Game_Map.prototype.setup = function(mapId) {
		_Game_Map_setup.apply(this, arguments);
		this.callEventsComponentStart();
	};
	
	Game_Map.prototype.callEventsComponentStart = function() {
		for (let i = 0; i < this._events.length; i++) {
			this._events[i].callComponentStart();
		}
	};

})();
