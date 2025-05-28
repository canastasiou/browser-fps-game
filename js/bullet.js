class Bullet {
    constructor(position, direction) {
        this.speed = 2.0;
        this.lifetime = 1000; // milliseconds
        this.createTime = performance.now();

        // Create bullet mesh
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);

        // Set initial position and direction
        this.mesh.position.copy(position);
        this.direction = direction.normalize();
    }

    update() {
        // Move bullet forward
        this.mesh.position.x += this.direction.x * this.speed;
        this.mesh.position.y += this.direction.y * this.speed;
        this.mesh.position.z += this.direction.z * this.speed;

        // Check if bullet should be removed
        return performance.now() - this.createTime < this.lifetime;
    }
}