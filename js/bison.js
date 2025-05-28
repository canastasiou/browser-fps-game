class Bison {
    constructor() {
        this.mesh = new THREE.Object3D();
        this.health = 100;
        this.isDead = false;
        this.meatDropped = false;
        this.droppedMeat = null;

        // Load the bison model
        const loader = new THREE.GLTFLoader();
        loader.load(
            'models/bison.glb',
            (gltf) => {
                this.mesh.add(gltf.scene);
                gltf.scene.scale.set(1, 1, 1);
                gltf.scene.rotation.y = 0.5 * Math.PI;

                // Add dark brown color to the model
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshPhongMaterial({
                            color: 0x4a3728,
                            shininess: 5
                        });
                    }
                });
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('An error occurred loading the model:', error);
            }
        );
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.health -= amount;
        console.log('Bison hit! Health:', this.health);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;

        this.isDead = true;
        console.log('Bison died!');

        // Create meat drop
        const meatGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.3);
        const meatMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        this.droppedMeat = new THREE.Mesh(meatGeometry, meatMaterial);
        this.droppedMeat.position.copy(this.mesh.position);
        this.droppedMeat.position.y = 0.1;
        scene.add(this.droppedMeat);
        this.meatDropped = true;

        // Hide the bison model
        this.mesh.visible = false;
    }

    checkMeatPickup(playerPosition) {
        if (this.isDead && this.meatDropped && this.droppedMeat) {
            // Get horizontal distance only (ignore y/height difference)
            const dx = playerPosition.x - this.droppedMeat.position.x;
            const dz = playerPosition.z - this.droppedMeat.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < 2) { // Increased pickup range to 2 units
                scene.remove(this.droppedMeat);
                this.droppedMeat = null;
                this.meatDropped = false;
                return true;
            }
        }
        return false;
    }
}

class Player {
    constructor() {
        this.position = { x: 0, y: 0, z: 0 };
        this.bison = new Bison();
        this.mesh = this.bison.mesh;

        // Add gamepad properties
        this.gamepadDeadzone = 0.1;
        this.moveSpeed = 0.1;

        // Add camera rotation properties
        this.cameraRotation = 0;
        this.rotationSpeed = 0.05;
    }

    moveForward(distance) {
        // Move in the direction the camera is facing
        this.mesh.position.x += Math.sin(this.cameraRotation) * distance;
        this.mesh.position.z += Math.cos(this.cameraRotation) * distance;
        this.position = this.mesh.position.clone();
    }

    moveBackward(distance) {
        // Move opposite to camera direction
        this.mesh.position.x -= Math.sin(this.cameraRotation) * distance;
        this.mesh.position.z -= Math.cos(this.cameraRotation) * distance;
        this.position = this.mesh.position.clone();
    }

    moveLeft(distance) {
        // Move perpendicular to camera direction
        this.mesh.position.x += Math.cos(this.cameraRotation) * distance;
        this.mesh.position.z -= Math.sin(this.cameraRotation) * distance;
        this.position = this.mesh.position.clone();
    }

    moveRight(distance) {
        // Move perpendicular to camera direction
        this.mesh.position.x -= Math.cos(this.cameraRotation) * distance;
        this.mesh.position.z += Math.sin(this.cameraRotation) * distance;
        this.position = this.mesh.position.clone();
    }

    getPosition() {
        return this.position;
    }

    handleGamepadInput() {
        const gamepads = navigator.getGamepads();
        if (!gamepads) return;

        const gamepad = gamepads.find(element => element !== null && element !== undefined);
        if (!gamepad) return;

        // Left stick movement
        if (Math.abs(gamepad.axes[0]) > this.gamepadDeadzone) {
            if (gamepad.axes[0] > 0) {
                this.moveRight(this.moveSpeed * Math.abs(gamepad.axes[0]));
            } else {
                this.moveLeft(this.moveSpeed * Math.abs(gamepad.axes[0]));
            }
        }

        if (Math.abs(gamepad.axes[1]) > this.gamepadDeadzone) {
            if (gamepad.axes[1] > 0) {
                this.moveBackward(this.moveSpeed * Math.abs(gamepad.axes[1]));
            } else {
                this.moveForward(this.moveSpeed * Math.abs(gamepad.axes[1]));
            }
        }

        // Right stick rotation
        if (Math.abs(gamepad.axes[2]) > this.gamepadDeadzone) {
            this.cameraRotation += gamepad.axes[2] * this.rotationSpeed;
        }
    }

    getCameraRotation() {
        return this.cameraRotation;
    }

    update() {
        // Handle gamepad input in the update loop
        this.handleGamepadInput();

        // Update position to match mesh position
        this.position.x = this.mesh.position.x;
        this.position.y = this.mesh.position.y;
        this.position.z = this.mesh.position.z;
    }
}
