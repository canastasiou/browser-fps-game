// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a8ebd);
const camera = new THREE.PerspectiveCamera(
    60,  // FOV reduced from 75 to 60 for less distortion
    window.innerWidth / window.innerHeight,
    0.1,  // Near plane
    2000  // Far plane increased from 1000 to 2000
);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});

// Player state
const player = {
    position: new THREE.Vector3(0, 1.7, 0), // Eye height
    rotation: 0,
    verticalRotation: 0,     // Add this line
    moveSpeed: 0.1,
    rotationSpeed: 0.05
};

// Add FPS counter variables after player state
let lastTime = performance.now();
let fps = 0;

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

// Create ground plane
const planeGeometry = new THREE.PlaneGeometry(2000, 2000); // Increased from 1000 to 2000
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x76b5c5 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
plane.position.y = 0; // Place at ground level
scene.add(plane);

// Basic renderer setup
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Create a test bison
const bison = new Bison();
scene.add(bison.mesh);
bison.mesh.position.set(0, 0, -10);

// Add raycaster for targeting
const raycaster = new THREE.Raycaster();
const targetableObjects = [bison.mesh]; // Array of objects that can be targeted

// Create trees around the bison
const tree1 = new Tree();
scene.add(tree1.mesh);
tree1.mesh.position.set(-3, 0, -12); // Left of bison

const tree2 = new Tree();
scene.add(tree2.mesh);
tree2.mesh.position.set(3, 0, -12); // Right of bison

const tree3 = new Tree();
scene.add(tree3.mesh);
tree3.mesh.position.set(0, 0, -15); // Behind bison

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
        const sidewaysMovement = -gamepad.axes[0] * player.moveSpeed;
        player.position.x -= Math.cos(player.rotation) * sidewaysMovement;  // Changed direction
        player.position.z += Math.sin(player.rotation) * sidewaysMovement;  // Changed direction
    }

    if (Math.abs(gamepad.axes[1]) > DEADZONE) {
        const forwardMovement = gamepad.axes[1] * player.moveSpeed; // Removed negative
        player.position.x += Math.sin(player.rotation) * forwardMovement;
        player.position.z += Math.cos(player.rotation) * forwardMovement;
    }

    // Right stick rotation (horizontal)
    if (Math.abs(gamepad.axes[2]) > DEADZONE) {
        player.rotation -= gamepad.axes[2] * player.rotationSpeed;
    }

    // Add vertical rotation (right stick vertical) - Reversed
    if (Math.abs(gamepad.axes[3]) > DEADZONE) {
        player.verticalRotation = Math.max(
            -Math.PI / 2,  // Looking straight down
            Math.min(
                Math.PI / 2,   // Looking straight up
                player.verticalRotation - gamepad.axes[3] * player.rotationSpeed  // Changed from + to -
            )
        );
    }
}

// Check targeting
function checkTargeting() {
    // Get debug element reference
    const debugEl = document.getElementById('debug');

    // Simple forward direction from camera's view
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    const intersects = raycaster.intersectObjects(targetableObjects, true);

    // Optional: Debug ray visualization
    // Remove any existing debug line
    const existingLine = scene.getObjectByName('debugRay');
    if (existingLine) scene.remove(existingLine);

    // Draw debug ray
    const rayLength = 20;
    const rayGeometry = new THREE.BufferGeometry().setFromPoints([
        camera.position,
        new THREE.Vector3(
            camera.position.x + raycaster.ray.direction.x * rayLength,
            camera.position.y + raycaster.ray.direction.y * rayLength,
            camera.position.z + raycaster.ray.direction.z * rayLength
        )
    ]);
    const rayLine = new THREE.Line(
        rayGeometry,
        new THREE.LineBasicMaterial({ color: intersects.length > 0 ? 0xff0000 : 0xffffff })
    );
    rayLine.name = 'debugRay';
    scene.add(rayLine);

    const crosshair = document.getElementById('crosshair');
    if (intersects.length > 0) {
        crosshair.classList.add('target');
        // Debug info in debug panel
        const hit = intersects[0];
        if (debugEl) {
            debugEl.textContent += `\nTarget: hit at ${hit.point.y.toFixed(2)}y, dist: ${hit.distance.toFixed(2)}`;
        }
    } else {
        crosshair.classList.remove('target');
    }
}

// Add debug update function before animate
function updateDebug() {
    const debugEl = document.getElementById('debug');
    debugEl.textContent =
`FPS: ${fps.toFixed(1)}
Position:
  X: ${player.position.x.toFixed(2)}
  Y: ${player.position.y.toFixed(2)}
  Z: ${player.position.z.toFixed(2)}
Rotation:
  H: ${(player.rotation * 180 / Math.PI).toFixed(1)}°
  V: ${(player.verticalRotation * 180 / Math.PI).toFixed(1)}°`;
}

// Game loop
function animate() {
    // Calculate FPS
    const currentTime = performance.now();
    fps = 1000 / (currentTime - lastTime);
    lastTime = currentTime;

    requestAnimationFrame(animate);

    // Handle keyboard movement
    if (moveState.forward) {
        player.position.x -= Math.sin(player.rotation) * player.moveSpeed;
        player.position.z -= Math.cos(player.rotation) * player.moveSpeed;
    }
    if (moveState.backward) {
        player.position.x += Math.sin(player.rotation) * player.moveSpeed;
        player.position.z += Math.cos(player.rotation) * player.moveSpeed;
    }
    if (moveState.left) {
        player.position.x -= Math.cos(player.rotation) * player.moveSpeed;  // Changed direction
        player.position.z += Math.sin(player.rotation) * player.moveSpeed;  // Changed direction
    }
    if (moveState.right) {
        player.position.x += Math.cos(player.rotation) * player.moveSpeed;  // Changed direction
        player.position.z -= Math.sin(player.rotation) * player.moveSpeed;  // Changed direction
    }

    // Handle gamepad
    handleGamepad();

    // Check targeting
    checkTargeting();

    // Handle gamepad shooting
    const gamepad = navigator.getGamepads()?.find(pad => pad !== null);
    if (gamepad && gamepad.buttons[7]?.pressed) { // Right trigger
        const intersects = raycaster.intersectObjects(targetableObjects, true);
        if (intersects.length > 0) {
            console.log('Hit!'); // Add shooting logic here
        }
    }

    // Update camera with both rotations
    camera.position.copy(player.position);
    camera.rotation.set(0, 0, 0);
    camera.rotateY(player.rotation);
    camera.rotateX(player.verticalRotation);

    // Update debug display
    updateDebug();

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