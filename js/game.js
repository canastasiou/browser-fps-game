// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a8ebd);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    //antialias: true,
    alpha: false // Disable alpha to prevent any transparency issues
});

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

// Create the ground plane
const planeGeometry = new THREE.PlaneGeometry(1000, 1000); // Made bigger to feel more infinite
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x76b5c5 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// Initialize the player
const player = new Player();
scene.add(player.mesh);

// Position camera higher and further back for better view
camera.position.set(0, 2, 5);
camera.lookAt(player.mesh.position);

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Game loop
function animate() {
    requestAnimationFrame(animate);
    player.update();
    renderer.render(scene, camera);
}

// Setup controls
setupControls(player);
animate();