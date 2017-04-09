var camera, tick = 0,
	scene, renderer, clock = new THREE.Clock(),
	controls, container,
	options, spawnerOptions, particleSystem;

var bufferLength, dataArray;
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var source;
var stream;

//set up the different audio nodes we will use for the app
var analyser = audioCtx.createAnalyser();
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;


//main block for doing the audio recording
if (navigator.getUserMedia) {
	 navigator.getUserMedia (
			// constraints - only audio needed for this app
			{
				 audio: true
			},

			// Success callback
			function(stream) {
				source = audioCtx.createMediaStreamSource(stream);
				source.connect(analyser);
			},

			// Error callback
			function(err) {
				 console.log('The following gUM error occured: ' + err);
			}
	 );
} else {
	 console.log('getUserMedia not supported on your browser!');
}

init();
animate();

function init() {
	analyser.fftSize = 256;
	bufferLength = analyser.frequencyBinCount;
	dataArray = new Uint8Array(bufferLength);

	container = document.getElementById( 'container' );

	camera = new THREE.PerspectiveCamera( 28, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.x = -50;
	camera.position.y = -50;
	camera.position.z = -50;

	scene = new THREE.Scene();

	// The GPU Particle system extends THREE.Object3D, and so you can use it
	// as you would any other scene graph component.  Particle positions will be
	// relative to the position of the particle system, but you will probably only need one
	// system for your whole scene

	particleSystem = new THREE.GPUParticleSystem( {
		maxParticles: 20000
	} );

	scene.add( particleSystem );

	// options passed during each spawned

	options = {
		position: new THREE.Vector3(0, 0, 0),
		positionRandomness: 3,
		velocity: new THREE.Vector3(0, 0, 0),
		velocityRandomness: 1,
		color: 0xaaaaff,
		colorRandomness: .2,
		turbulence: .5,
		lifetime: 4,
		size: 5,
		sizeRandomness: 1
	};

	spawnerOptions = {
		spawnRate: 10000,
		horizontalSpeed: 0,
		verticalSpeed: 0,
		timeScale: 1
	};

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );

				// setup controls
	/*
				controls = new THREE.TrackballControls(camera, renderer.domElement);
				controls.rotateSpeed = 5.0;
				controls.zoomSpeed = 2.2;
				controls.panSpeed = 1;
				controls.dynamicDampingFactor = 0.3;
	*/
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
	requestAnimationFrame( animate );
				//controls.update();

  //console.log(dataArray);
	var delta = clock.getDelta() * spawnerOptions.timeScale;
	tick += delta;

	camera.lookAt(scene.position);
	analyser.getByteFrequencyData(dataArray);

	if ( tick < 0 ) tick = 0;

		var loClip = 28;
		var freqAvg = dataArray.slice(0, loClip).reduce(function(prevSum, freq) { return prevSum + freq }) / loClip;
		var energyLevel = Math.round(10/150 * freqAvg) < 9 ? Math.min(Math.round(10/150 * freqAvg), 1) : 10;

		options.position.x = 0;
		options.velocityRandomness = energyLevel;
		options.lifetime = energyLevel;
		options.color = new THREE.Color('rgb(' + Number(255 + (-10 * energyLevel)) + ', 150,' + Number(150 + energyLevel * 10) + ')').getHex();
    //options.color = 0xffffff;

    for ( var x = 0; x < spawnerOptions.spawnRate * delta; x++ ) {

			// Yep, that's really it. Spawning particles is super cheap, and once you spawn them, the rest of
			// their lifecycle is handled entirely on the GPU, driven by a time uniform updated below

			particleSystem.spawnParticle( options );

      //console.log(options);
		}

 // }

	particleSystem.update( tick );

	render();

}

function render() {
	renderer.render( scene, camera );
}
