// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a8ebd);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});

// Player state
const player = {
    position: new THREE.Vector3(0, 1.7, 0), // Eye height
    rotation: 0,
    moveSpeed: 0.1,
    rotationSpeed: 0.05
};

// Movement state
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Basic renderer setup
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Create a test bison
const bison = new Bison();
scene.add(bison.mesh);
bison.mesh.position.set(0, 0.5, -10); // Place bison 10 units ahead

// Handle keyboard controls
document.addEventListener('keydown', (event) => {
    switch(event.code) {
        case 'KeyW': moveState.forward = true; break;
        case 'KeyS': moveState.backward = true; break;
        case 'KeyA': moveState.left = true; break;
        case 'KeyD': moveState.right = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    switch(event.code) {
        case 'KeyW': moveState.forward = false; break;
        case 'KeyS': moveState.backward = false; break;
        case 'KeyA': moveState.left = false; break;
        case 'KeyD': moveState.right = false; break;
    }
});

// Handle gamepad input
function handleGamepad() {
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    const gamepad = gamepads.find(element => element !== null && element !== undefined);
    if (!gamepad) return;

    const DEADZONE = 0.1;

    // Left stick movement
    if (Math.abs(gamepad.axes[0]) > DEADZONE) {
        const sidewaysMovement = -gamepad.axes[0] * player.moveSpeed; // Added negative
        player.position.x += Math.cos(player.rotation) * sidewaysMovement;
        player.position.z += Math.sin(player.rotation) * sidewaysMovement;
    }

    if (Math.abs(gamepad.axes[1]) > DEADZONE) {
        const forwardMovement = gamepad.axes[1] * player.moveSpeed; // Removed negative
        player.position.x += Math.sin(player.rotation) * forwardMovement;
        player.position.z += Math.cos(player.rotation) * forwardMovement;
    }

    // Right stick rotation
    if (Math.abs(gamepad.axes[2]) > DEADZONE) {
        player.rotation -= gamepad.axes[2] * player.rotationSpeed; // Changed from +=
    }
}

// Game loop
function animate() {
    requestAnimationFrame(animate);

    // Handle keyboard movement
    if (moveState.forward) {
        player.position.x -= Math.sin(player.rotation) * player.moveSpeed;  // Changed from +=
        player.position.z -= Math.cos(player.rotation) * player.moveSpeed;  // Changed from +=
    }
    if (moveState.backward) {
        player.position.x += Math.sin(player.rotation) * player.moveSpeed;  // Changed from -=
        player.position.z += Math.cos(player.rotation) * player.moveSpeed;  // Changed from -=
    }
    if (moveState.left) {
        player.position.x += Math.cos(player.rotation) * player.moveSpeed;  // Changed from -=
        player.position.z -= Math.sin(player.rotation) * player.moveSpeed;  // Changed from +=
    }
    if (moveState.right) {
        player.position.x -= Math.cos(player.rotation) * player.moveSpeed;  // Changed from +=
        player.position.z += Math.sin(player.rotation) * player.moveSpeed;  // Changed from -=
    }

    // Handle gamepad
    handleGamepad();

    // Update camera
    camera.position.copy(player.position);
    camera.rotation.y = player.rotation;

    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the game
animate();