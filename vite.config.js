import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const walkerManifestPlugin = () => {
  const publicDir = path.resolve(__dirname, 'public');
  const generatedModulePath = path.resolve(__dirname, 'src/generated/walker-assets.generated.js');
  const walkerFolderPattern = /^(person|cat|dog)\d+$/i;
  const imageExtensionPattern = /\.(png|jpe?g|webp)$/i;

  const getLastNumber = (value) => {
    const matches = value.match(/\d+/g);
    return matches ? Number(matches[matches.length - 1]) : 0;
  };

  const compareByNumericSuffix = (left, right) => {
    const leftNumber = getLastNumber(left);
    const rightNumber = getLastNumber(right);

    if (leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }

    return left.localeCompare(right);
  };

  const getWalkerKind = (folderName) => {
    if (folderName.startsWith('dog')) return 'dog';
    if (folderName.startsWith('cat')) return 'cat';
    return 'person';
  };

  const buildManifest = () => {
    if (!fs.existsSync(publicDir)) {
      return [];
    }

    return fs
      .readdirSync(publicDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && walkerFolderPattern.test(entry.name))
      .map((entry) => {
        const folderPath = path.join(publicDir, entry.name);
        const frames = fs
          .readdirSync(folderPath, { withFileTypes: true })
          .filter((fileEntry) => fileEntry.isFile() && imageExtensionPattern.test(fileEntry.name))
          .map((fileEntry) => `/${entry.name}/${fileEntry.name}`)
          .sort(compareByNumericSuffix);

        return {
          id: entry.name,
          kind: getWalkerKind(entry.name),
          frames
        };
      })
      .filter(({ frames }) => frames.length > 0)
      .sort((left, right) => compareByNumericSuffix(left.id, right.id));
  };

  const writeManifestFile = () => {
    const manifest = buildManifest();
    const fileContents = `const autoWalkerAssetManifest = ${JSON.stringify(manifest, null, 2)};\n\nexport default autoWalkerAssetManifest;\n`;

    fs.mkdirSync(path.dirname(generatedModulePath), { recursive: true });
    fs.writeFileSync(generatedModulePath, fileContents);
  };

  return {
    name: 'walker-manifest',
    buildStart() {
      writeManifestFile();
    },
    configureServer(server) {
      writeManifestFile();

      const syncManifest = () => {
        writeManifestFile();
        const generatedModule = server.moduleGraph.getModuleById(generatedModulePath);
        if (generatedModule) {
          server.moduleGraph.invalidateModule(generatedModule);
        }
      };

      server.watcher.add(publicDir);
      server.watcher.on('add', (file) => {
        if (file.startsWith(publicDir) && /[/\\](person|cat|dog)\d+[/\\]/i.test(file)) {
          syncManifest();
        }
      });
      server.watcher.on('unlink', (file) => {
        if (file.startsWith(publicDir) && /[/\\](person|cat|dog)\d+[/\\]/i.test(file)) {
          syncManifest();
        }
      });
      server.watcher.on('addDir', (file) => {
        if (file.startsWith(publicDir) && walkerFolderPattern.test(path.basename(file))) {
          syncManifest();
        }
      });
      server.watcher.on('unlinkDir', (file) => {
        if (file.startsWith(publicDir) && walkerFolderPattern.test(path.basename(file))) {
          syncManifest();
        }
      });
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(publicDir) && /[/\\](person|cat|dog)\d+[/\\]/i.test(file)) {
        writeManifestFile();
        const generatedModule = server.moduleGraph.getModuleById(generatedModulePath);
        if (generatedModule) server.moduleGraph.invalidateModule(generatedModule);
        server.ws.send({ type: 'full-reload' });
      }
    }
  };
};

export default defineConfig({
  plugins: [react(), walkerManifestPlugin()],
});
