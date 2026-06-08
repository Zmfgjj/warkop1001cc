import localtunnel from 'localtunnel';

const port = process.env.PORT ? Number(process.env.PORT) : 5173;
const subdomain = process.env.SUBDOMAIN || 'warkop1001cc-publik';

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port, subdomain });
    console.log('🚀 Public tunnel ready!');
    console.log(`Open this URL in a browser: ${tunnel.url}`);
    console.log('Use the public menu route, for example:');
    console.log(`${tunnel.url}/menu/011`);

    tunnel.on('close', () => {
      console.log('Tunnel closed');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      tunnel.close();
    });
  } catch (error) {
    console.error('Failed to start tunnel:', error.message || error);
    process.exit(1);
  }
}

startTunnel();
