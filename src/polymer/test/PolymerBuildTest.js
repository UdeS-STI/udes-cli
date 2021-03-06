/* eslint-env mocha */
/* eslint no-unused-expressions: 0 */
import 'babel-polyfill';
import { expect } from 'chai';
import fs from 'fs';

import PolymerBuild from './../PolymerBuild';

const buildFiles = ['index.html', 'index.php'];
const files = ['htaccess.sample'];

const deleteFolderRecursive = (path) => {
  fs.readdirSync(path).forEach((file) => {
    const currentPath = `${path}/${file}`;
    if (fs.lstatSync(currentPath).isDirectory()) {
      deleteFolderRecursive(currentPath);
    } else {
      fs.unlinkSync(currentPath);
    }
  });

  fs.rmdirSync(path);
};

describe('PolymerBuild', () => {
  describe('constructor', () => {
    it('should throw an error if argument `rootURI` is missing', () => {
      const options = { buildNames: [] };
      expect(() => new PolymerBuild(options)).to.throw(Error);
    });

    it('should not throw an error for correct baseURIs', () => {
      const baseURIs = [
        '/',
        '/~ranb2002/',
        '/www.exemple.com/',
        'https://www.exemple.com/',
        'https://www.exemple.com/~ranb2002/',
      ];

      baseURIs.forEach((baseURI) => {
        const options = { baseURI, buildNames: [] };
        expect(() => new PolymerBuild(options)).not.to.throw(Error);
      });
    });

    it('should throw an error for invalid baseURIs', () => {
      const baseURIs = [
        '/~ranb2002',
        '/www.exemple.com',
        'https://www.exemple.com',
        'https://www.exemple.com/~ranb2002',
        '~ranb2002/',
        'www.exemple.com/',
      ];

      baseURIs.forEach((baseURI) => {
        const options = { baseURI, buildNames: [] };
        expect(() => new PolymerBuild(options)).to.throw(Error);
      });
    });
  });

  describe('run', () => {
    before(() => {
      if (!fs.existsSync('build')) {
        fs.mkdirSync('build');
        fs.mkdirSync('build/bundled');
      }

      // TODO: Use fs.copyFileSync() after updating to node 8.
      files.forEach((filename) => {
        fs.writeFileSync(filename, fs.readFileSync(`${__dirname}/assets/${filename}`));
      });
    });

    beforeEach(() => {
      buildFiles.forEach((filename) => {
        // TODO: Use fs.copyFileSync() after updating to node 8.
        fs.writeFileSync(`build/bundled/${filename}`, fs.readFileSync(`${__dirname}/assets/${filename}`));
      });
    });

    after(() => {
      deleteFolderRecursive('build');
      files.forEach((filename) => {
        fs.unlinkSync(filename);
      });
    });

    it('should create build for production', () => {
      const options = {
        baseURI: '/src/',
        build: false,
        buildNames: ['bundled'],
      };
      const polymerBuild = new PolymerBuild(options);
      polymerBuild.run();

      const indexHtml = fs.readFileSync('build/bundled/index.html').toString();

      expect(indexHtml).to.be.equal('<!DOCTYPE html><html><head><base href="/src/" /></head><body></body></html>\n');
      expect(fs.existsSync('build/bundled/index.php')).to.be.false;
      expect(fs.existsSync('build/bundled/.htaccess')).to.be.false;
    });

    it('should create build for dev', () => {
      const options = {
        addBuildDir: true,
        addBuildName: true,
        baseURI: '/src/',
        build: false,
        buildNames: ['bundled'],
        copyHtaccessSample: true,
      };
      const polymerBuild = new PolymerBuild(options);
      polymerBuild.run();

      const indexHtml = fs.readFileSync('build/bundled/index.html').toString();
      const indexPhp = fs.readFileSync('build/bundled/index.php').toString();
      const htaccess = fs.readFileSync('build/bundled/.htaccess').toString();

      expect(indexHtml).to.be.equal(
        '<!DOCTYPE html><html><head><base href="/src/build/bundled/" /></head><body></body></html>\n'
      );
      expect(indexPhp).to.be.equal('<?php echo "This is a PHP file"; ?>\n');
      expect(htaccess).to.be.equal('RewriteBase /src/build/bundled/\n');
    });
  });
});
