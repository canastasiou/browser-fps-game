class Tree {
    constructor() {
        this.mesh = new THREE.Object3D();

        // Create tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 4, 8); // Height changed from 2 to 4
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x4d2926 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 2; // Position changed from 1 to 2

        // Create tree top (leaves)
        const leavesGeometry = new THREE.ConeGeometry(1, 4, 8); // Height changed from 2 to 4
        const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x0d5c0d });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 5; // Position changed from 2.5 to 5

        this.mesh.add(trunk);
        this.mesh.add(leaves);
    }
}