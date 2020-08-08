import './EventComponent';
//import EventComponent from './EventComponent';

class EventComponentShowcase extends EventComponent {
	
	_initField;
	_nonInitField;
	
	static get initVariables() {
		return ["_initField"];
	}
	
	start() {
		
	}
	
	update() {
		
	}
	
	doSomething() {
		this.StartCoroutine(someCoroutine());
	}
	
	* someCoroutine() {
		let i = 0;
		i++;
		yield* WaitForSeconds(1.0);
		yield* WaitForFrames(30);
		i++;
	}

	// Event Handlers
	// ----------------
	onSceneStart() {
		// called when scene starts
	}

	onLoadFromSaveContents() {
		// called when load from save contents
	}
}
