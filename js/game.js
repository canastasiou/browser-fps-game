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
    alpha: false,
    powerPreference: "high-performance",
    precision: "highp",
    stencil: false,          // Add this if you don't need stencil buffer
    depth: true,             // Keep depth testing
    logarithmicDepthBuffer: true  // Better depth handling for large scenes
});

// Enable shadow mapping with better performance
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;

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

// Replace individual tree creation with instanced trees
const treeInstancer = new TreeInstancer(treePositions);

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
const bulletPool = new BulletPool(20);

function shoot() {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);

    const bullet = bulletPool.getBullet(camera.position.clone(), direction);
    if (bullet) {
        bullet.createTime = performance.now();
        bullet.speed = 2.0;  // Add speed property
    }
}

// Check targeting
let lastRaycastTime = 0;
const RAYCAST_INTERVAL = 100; // ms between raycasts

function checkTargeting() {
    const now = performance.now();
    if (now - lastRaycastTime < RAYCAST_INTERVAL) return;
    lastRaycastTime = now;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(
        bisons.filter(b => !b.isDead && b.mesh.visible)
            .map(b => b.mesh),
        true
    );

    const crosshair = document.getElementById('crosshair');
    crosshair.classList.toggle('target', intersects.length > 0);
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
    // Use requestAnimationFrame at start
    requestAnimationFrame(animate);

    // Throttle updates to 60fps
    const currentTime = performance.now();
    if (currentTime - lastTime < 16.66) return; // Skip if less than ~60fps time has passed

    // Calculate FPS
    fps = 1000 / (currentTime - lastTime);
    lastTime = currentTime;

    // Update visibility before rendering
    updateVisibility();

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
    bulletPool.active.forEach(bullet => {
        const moveVector = bullet.direction.clone().multiplyScalar(bullet.speed);
        bullet.mesh.position.add(moveVector);

        const alive = performance.now() - bullet.createTime < 1000;
        if (!alive) {
            bulletPool.returnBullet(bullet);
        } else {
            // Check for collisions with targets
            const raycaster = new THREE.Raycaster(bullet.mesh.position, bullet.direction);
            const intersects = raycaster.intersectObjects(targetableObjects, true);

            if (intersects.length > 0 && intersects[0].distance < bullet.speed) {
                const hitMesh = intersects[0].object;
                const hitBison = bisons.find(bison => {
                    let isBisonMesh = false;
                    bison.mesh.traverse((child) => {
                        if (child === hitMesh) isBisonMesh = true;
                    });
                    return isBisonMesh;
                });

                if (hitBison && !hitBison.isDead) {
                    hitBison.takeDamage(25);
                    bulletPool.returnBullet(bullet);
                }
            }
        }
    });

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

// Add after scene creation
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();

function updateVisibility() {
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    // Use object bounds for faster GPU culling
    bisons.forEach(bison => {
        if (bison.mesh && !bison.isDead) {
            // Get the bison's geometry through the GLTF model
            if (!bison.mesh.boundingSphere) {
                bison.mesh.traverse(child => {
                    if (child.isMesh && child.geometry) {
                        child.geometry.computeBoundingSphere();
                        bison.mesh.boundingSphere = child.geometry.boundingSphere.clone();
                    }
                });
            }

            const distance = camera.position.distanceTo(bison.mesh.position);
            bison.mesh.visible = distance < 100 &&
                (bison.mesh.boundingSphere ?
                    frustum.intersectsSphere(bison.mesh.boundingSphere) : true);
            bison.mesh.frustumCulled = true;
        }
    });
}

// Start the game
animate();