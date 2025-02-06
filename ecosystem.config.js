export default {
    apps: [
        {
            name: "Penyewaan",
            script: "build/server.js",
            instances: "max",
            exec_mode: "cluster",
            watch: false,
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};
