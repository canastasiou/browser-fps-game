class Player {
    constructor() {
        this.position = { x: 0, y: 0, z: 0 };
        this.mesh = new THREE.Object3D(); // Temporary empty object
        this.mesh.position.y = 0.5;

        // Load the bison model
        const loader = new THREE.GLTFLoader();
        loader.load(
            'models/bison.glb', // You'll need to create this directory and add your model
            (gltf) => {
                this.mesh.add(gltf.scene);
                gltf.scene.scale.set(1, 1, 1); // Adjust scale as needed
                gltf.scene.rotation.y = 0.5 * Math.PI; // Make it face forward
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('An error occurred loading the model:', error);
            }
        );

        // Add gamepad properties
        this.gamepadDeadzone = 0.1;
        this.moveSpeed = 0.1;
    }

    moveForward(distance) {
        this.mesh.position.z += distance; // Changed from -=
        this.position.z = this.mesh.position.z;
    }

    moveBackward(distance) {
        this.mesh.position.z -= distance; // Changed from +=
        this.position.z = this.mesh.position.z;
    }

    moveLeft(distance) {
        this.mesh.position.x += distance; // Changed from -=
        this.position.x = this.mesh.position.x;
    }

    moveRight(distance) {
        this.mesh.position.x -= distance; // Changed from +=
        this.position.x = this.mesh.position.x;
    }

    getPosition() {
        return this.position;
    }

    handleGamepadInput() {
        const gamepads = navigator.getGamepads();
        if (!gamepads) return;

        const gamepad = gamepads.find(element => element !== null && element !== undefined);
        if (!gamepad) return;

        // Left stick X axis (horizontal movement)
        if (Math.abs(gamepad.axes[0]) > this.gamepadDeadzone) {
            if (gamepad.axes[0] > 0) {
                this.moveRight(this.moveSpeed * Math.abs(gamepad.axes[0]));  // Changed from moveLeft
            } else {
                this.moveLeft(this.moveSpeed * Math.abs(gamepad.axes[0]));   // Changed from moveRight
            }
        }

        // Left stick Y axis (vertical movement)
        if (Math.abs(gamepad.axes[1]) > this.gamepadDeadzone) {
            if (gamepad.axes[1] > 0) {
                this.moveBackward(this.moveSpeed * Math.abs(gamepad.axes[1])); // Changed from moveForward
            } else {
                this.moveForward(this.moveSpeed * Math.abs(gamepad.axes[1]));  // Changed from moveBackward
            }
        }
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
