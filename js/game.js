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
    verticalRotation: 0,
    moveSpeed: 0.22,
    rotationSpeed: 0.05,
    meatCollected: 0
};

// Add FPS counter variables after player state
let lastTime = performance.now();
let fps = 0;

// Add bullet management variables
const bullets = [];
let lastShotTime = 0;
const SHOT_COOLDOWN = 250; // milliseconds between shots

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

// Create multiple bisons
const bisons = [];
const bisonPositions = [
    { x: 0, z: -10 },    // Original bison position
    { x: -15, z: -20 },  // Left far
    { x: 15, z: -20 },   // Right far
    { x: -8, z: -30 },   // Left very far
    { x: 8, z: -30 },    // Right very far
    { x: 0, z: -25 }     // Center far
];

bisonPositions.forEach(pos => {
    const bison = new Bison();
    scene.add(bison.mesh);
    bison.mesh.position.set(pos.x, 0, pos.z);
    bisons.push(bison);
});

// Create trees around the area
const treePositions = [
    // Near trees
    { x: -3, z: -12 },  // Original left tree
    { x: 3, z: -12 },   // Original right tree
    { x: 0, z: -15 },   // Original back tree
    // Additional trees
    { x: -10, z: -15 }, // Far left
    { x: 10, z: -15 },  // Far right
    { x: -5, z: -25 },  // Back left
    { x: 5, z: -25 },   // Back right
    { x: -8, z: -20 },  // Mid left
    { x: 8, z: -20 },   // Mid right
    { x: 0, z: -35 },   // Far back
    { x: -15, z: -30 }, // Far left back
    { x: 15, z: -30 }   // Far right back
];

treePositions.forEach(pos => {
    const tree = new Tree();
    scene.add(tree.mesh);
    tree.mesh.position.set(pos.x, 0, pos.z);
});

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

    // Handle shooting with right trigger
    if (gamepad.buttons[7]?.pressed) {
        const currentTime = performance.now();
        if (currentTime - lastShotTime >= SHOT_COOLDOWN) {
            shoot();
            lastShotTime = currentTime;
        }
    }
}

// Add shooting function
function shoot() {
    // Create direction vector from camera
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);

    // Create bullet starting from camera position
    const bullet = new Bullet(camera.position.clone(), direction);
    scene.add(bullet.mesh);
    bullets.push(bullet);
}

// Check targeting
function checkTargeting() {
    // Simple forward direction from camera's view
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(targetableObjects, true);

    // Update crosshair state
    const crosshair = document.getElementById('crosshair');
    if (intersects.length > 0) {
        crosshair.classList.add('target');
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
  V: ${(player.verticalRotation * 180 / Math.PI).toFixed(1)}°
Meat Collected: ${player.meatCollected}`; // Add this line
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

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        if (!bullet.update()) {
            scene.remove(bullet.mesh);
            bullets.splice(i, 1);
            continue;
        }

        // Check for collisions with targets
        const bulletPosition = bullet.mesh.position;
        const raycaster = new THREE.Raycaster(bulletPosition, bullet.direction);
        const intersects = raycaster.intersectObjects(targetableObjects, true);

        if (intersects.length > 0 && intersects[0].distance < bullet.speed) {
            const hitMesh = intersects[0].object;
            console.log('Hit mesh:', hitMesh); // Debug hit mesh

            const hitBison = bisons.find(bison => {
                // Check if the hit mesh is part of this bison's hierarchy
                let isBisonMesh = false;
                bison.mesh.traverse((child) => {
                    if (child === hitMesh) {
                        isBisonMesh = true;
                    }
                });
                return isBisonMesh;
            });

            console.log('Found bison:', hitBison); // Debug found bison

            if (hitBison && !hitBison.isDead) {
                console.log('Applying damage to bison'); // Debug damage application
                hitBison.takeDamage(25);
                scene.remove(bullet.mesh);
                bullets.splice(i, 1);
            }
        }
    }

    // Check for meat pickup from any bison
    bisons.forEach(bison => {
        if (bison.checkMeatPickup(player.position)) {
            player.meatCollected++;
        }
    });

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

// Add after creating bisons array and before checkTargeting function
const raycaster = new THREE.Raycaster();
const targetableObjects = bisons.map(bison => bison.mesh);

// Start the game
animate();