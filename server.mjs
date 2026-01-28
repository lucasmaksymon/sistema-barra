import https from 'https';
import next from 'next';
import devcert from 'devcert';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    console.log('🔒 Generando certificados SSL...');
    const ssl = await devcert.certificateFor('localhost');

    await app.prepare();

    https.createServer(ssl, (req, res) => {
      handle(req, res);
    }).listen(PORT, (err) => {
      if (err) throw err;
      console.log(`\n✅ Ready on https://localhost:${PORT}`);
      console.log('🔒 HTTPS habilitado - El escáner de cámara funcionará correctamente\n');
    });
  } catch (error) {
    console.error('Error al iniciar servidor HTTPS:', error);
    process.exit(1);
  }
})();
