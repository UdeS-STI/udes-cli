/**
 * Created by fgam2701 on 2017-07-19.
 *
 * Arguments :
 *
 * @param {string} -rootURI
 * Bla bla
 *
 *      -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 *
 * @param {boolean} -rewriteBuildDev (optional)
 * Bla bla
 *
 *      -rewriteBuildDev=true
 *
 * @param {string} -buildFolder (optional)
 * Par défaut : 'build/'
 *
 *      -buildFolder='output/'
 *
 * // TODO
 * @param {string} -buildName (optional)
 * Par défaut : -buildName=bundled et -buildName=unbundled
 *
 * # Exemple :
 *
 *      node index.js -- -addBuildDir=true -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 *
 *      npm run build -- -rootURI='~webv9201/nsquart2/inscription-fcnc/'
 *
 */
console.log("");

const cpx = require("cpx");
const fs = require('fs');
const replace = require("replace-in-file");
const inline = require('inline-source');
const path = require('path');

const NOM_ARGUMENT_POUR_REWRITE_SANS_DOSSIER_BUILD = "noBuildDir";

// arguments
let dir = "build/";
let devdir;
let listeNomsBuild = [];
let debug = true;
let rewriteBuildDev = false;


function formatDir(dir) {
  if ( !dir.endsWith( '/' ) ) {
    dir += "/";
  }
  if ( dir.startsWith( '/' ) ) {
    dir = dir.substr( 1, dir.length - 1 );
  }
  if (debug) {
    console.log( "\tdir: " + dir );
  }
  return dir;
}

/**
 *
 * @param arguments
 */
function validerLesArguments (argv) {
  if (debug) {
    console.log("argv", argv);
  }

  argv.forEach(arg => {
    const splitted = arg.split('=');
    const cle = splitted[0];
    const valeur = splitted[1];

    switch (cle) {
      case '-rewriteBuildDev' :
        rewriteBuildDev = true;
        if (debug) {
          console.log("\t.htaccess Rewrite sans dossier du build: " + rewriteBuildDev + "\n");
        }
        break;
      case '-rootURI' :
        devdir = formatDir(valeur);
        break;
      case '-buildName' :
        listeNomsBuild = valeur.split(',');
        break;
      case '-buildFolder' :
        dir = formatDir(valeur);
        break;
    }
  });

  if (!devdir) {
    throw "argument `-rootURI` non défini";
  }

  if (!listeNomsBuild.length) {
    // valeurs par défaut
    //listeNomsBuild = ['bundled', 'unbundled', 'es5-bundled'];
  }
}

function copieHtaccess (dossierDuBuild) {
  const sourceHtaccess = "htaccess.sample";
  const htaccessSample = dossierDuBuild + "/" + sourceHtaccess;
  const htaccess = dossierDuBuild + '/.htaccess';

  if ( !fs.existsSync( sourceHtaccess ) ) {
    throw "Erreur, Le fichier " + sourceHtaccess + " n'existe pas.";
  }

  console.log( "\tcopie de .htaccess.sample vers " + dossierDuBuild + "..." );
  cpx.copySync( sourceHtaccess, dossierDuBuild );
  console.log( "\trenommer de " + htaccessSample + " vers " + htaccess + "..." );
  fs.renameSync( htaccessSample, htaccess);
  if ( !fs.existsSync( htaccess ) ) {
    throw "Erreur, Le fichier " + htaccess + " n'existe pas";
  }
  console.log( "\trenommer ok!\n" );
}

function remplacementRewriteHtaccess (dossierDuBuild) {
  var htaccess = dossierDuBuild + '/.htaccess';

  console.log( "\tRemplacer le RewriteBase de %s ...", htaccess);
  var changedFiles = replace.sync( {
    files: htaccess,
    from: /RewriteBase[\s]+.*/,
    to: "RewriteBase /" + devdir + (rewriteBuildDev ? dossierDuBuild : "")
  } );
  if ( changedFiles.length === 0 ) {
    throw ".htaccess non modifié";
  }
  console.log( "\t.htaccess modifié!\n");
}

function modifierMetaBaseIndex (dossierDuBuild) {
  var index = dossierDuBuild + "/_index.html";

  console.log( "\tRemplacer le <meta base> de %s ...", index);
  var changedFiles = replace.sync( {
    files: index,
    from: /base\shref="https:\/\/www.usherbrooke.ca[\w\d\-~=+#\/]*/,
    to: "base href=\"/" //pour l'exécution en local, ne change rien dans l'environnement de dev.
  } );
  console.log( "\t_index.html modifié: %s \n", changedFiles.length > 0 );
}

function modifierInlineIndex (dossierDuBuild) {
  var htaccess = dossierDuBuild + '/.htaccess',
    index = dossierDuBuild + "/_index.html";

  console.log( "\tRemplacer les <src inline=\"\"> par <src inline> dans %s ...", index);
  var changedFiles = replace.sync( {
    files: index,
    from: /inline=""/g,
    to: "inline"
  } );
  if ( changedFiles.length === 0 ) {
    throw "Aucun remplacement de « inline=\"\" » dans " + index;
  }
  console.log( "\tRemplacer <src inline> Ok!\n" );
}

function compresserInlineIndex (dossierDuBuild) {
  var index = dossierDuBuild + "/_index.html";

  console.log( "\tMettre inline et compresser les <src inline> dans %s ...", index);
  var html = inline.sync(path.resolve(index), {
    compress: true,
    rootpath: path.resolve('./')
  });
  if(!html) {
    throw ".htaccess non compressé";
  }
  console.log( "\tMettre inline et compresser les <src inline> Ok!\n" );
}

try {
  validerLesArguments(process.argv);

  listeNomsBuild.forEach(nomBuild => {
    var dossierDuBuild = dir + nomBuild;
    console.log("dossierDuBuild : ", dossierDuBuild);

    copieHtaccess(dossierDuBuild);
    remplacementRewriteHtaccess(dossierDuBuild);
    modifierMetaBaseIndex(dossierDuBuild);
    modifierInlineIndex(dossierDuBuild);
    compresserInlineIndex(dossierDuBuild);
  });

  process.exit(0);
} catch (error) {
  console.error("\033[1;31m \n\n===========\n" +
    "ERREUR!!!!\n" +
    "%s\n" +
    "===============\n", error);
  process.exit(1);
}