class Bison {
    constructor() {
        this.mesh = new THREE.Object3D();
        this.mesh.position.y = 0.5;

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
