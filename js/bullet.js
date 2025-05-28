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
        this.mesh.position.x += this.direction.x * this.speed;
        this.mesh.position.y += this.direction.y * this.speed;
        this.mesh.position.z += this.direction.z * this.speed;
        return performance.now() - this.createTime < this.lifetime;
    }
}

class BulletPool {
    constructor(size = 20) {
        this.pool = [];
        this.active = new Set();

        for (let i = 0; i < size; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 8, 8);
            const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.visible = false;
            scene.add(mesh);
            this.pool.push({
                mesh,
                direction: new THREE.Vector3()
            });
        }
    }

    getBullet(position, direction) {
        const bullet = this.pool.find(b => !this.active.has(b));
        if (bullet) {
            bullet.mesh.visible = true;
            bullet.mesh.position.copy(position);
            bullet.direction.copy(direction).normalize();
            this.active.add(bullet);
        }
        return bullet;
    }

    returnBullet(bullet) {
        bullet.mesh.visible = false;
        this.active.delete(bullet);
    }
}