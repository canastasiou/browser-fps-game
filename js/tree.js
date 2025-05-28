class TreeInstancer {
    constructor(positions) {
        // Create tree parts
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 4, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x4d2926 });
        const leavesGeometry = new THREE.ConeGeometry(1, 4, 8);
        const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x0d5c0d });

        // Create instanced meshes for trunk and leaves
        this.trunkMesh = new THREE.InstancedMesh(
            trunkGeometry,
            trunkMaterial,
            positions.length
        );
        this.leavesMesh = new THREE.InstancedMesh(
            leavesGeometry,
            leavesMaterial,
            positions.length
        );

        // Set positions for all instances
        const matrix = new THREE.Matrix4();
        positions.forEach((pos, i) => {
            // Set trunk position
            matrix.setPosition(pos.x, 2, pos.z);
            this.trunkMesh.setMatrixAt(i, matrix);

            // Set leaves position
            matrix.setPosition(pos.x, 5, pos.z);
            this.leavesMesh.setMatrixAt(i, matrix);
        });

        this.trunkMesh.instanceMatrix.needsUpdate = true;
        this.leavesMesh.instanceMatrix.needsUpdate = true;

        scene.add(this.trunkMesh);
        scene.add(this.leavesMesh);
    }
}