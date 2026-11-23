#!/usr/bin/env node
// Rattrapage : récupère le code de l'étape <n> depuis le dépôt « solutions ».
//
//   npm run rattrapage -- 2        # code corrigé à la FIN de l'étape 2
//   npm run rattrapage -- bonus    # code complet avec le bonus
//   npm run rattrapage -- 2 --yes  # sans demander de confirmation
//
// Ce que fait le script :
//   1. sauvegarde votre dossier src/ dans .rattrapage-backup/<date>/ ;
//   2. télécharge la branche etape-<n> du dépôt solutions ;
//   3. remplace le contenu de src/ par celui de cette branche.
// Votre fichier .env et vos dossiers test/ et docs/ ne sont pas touchés.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

// Surchargeable avec la variable d'environnement SOLUTIONS_URL.
const SOLUTIONS_URL =
  process.env.SOLUTIONS_URL ?? 'https://github.com/LaCoir/tp-nestjs-solutions';
const REMOTE = 'solutions';
const VALID = ['0', '1', '2', '3', 'bonus'];

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

const args = process.argv.slice(2);
const assumeYes = args.includes('--yes') || args.includes('-y');
const step = args.find((arg) => !arg.startsWith('-'));

if (!step || !VALID.includes(step)) {
  fail(`Usage : npm run rattrapage -- <${VALID.join('|')}>\n   Exemple : npm run rattrapage -- 2`);
}

try {
  git('rev-parse', '--is-inside-work-tree');
} catch {
  fail("Ce dossier n'est pas un dépôt Git. Lancez la commande depuis la racine du projet cloné.");
}

if (!existsSync('src')) {
  fail('Dossier src/ introuvable : lancez la commande depuis la racine du projet.');
}

const branch = `etape-${step}`;
const target = step === 'bonus' ? 'bonus' : branch;

if (!assumeYes) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    `Le dossier src/ va être remplacé par la version « ${target} » (une copie de sauvegarde est faite). Continuer ? (o/N) `,
  );
  rl.close();
  if (!/^(o|oui|y|yes)$/i.test(answer.trim())) {
    console.log('Annulé : rien n’a été modifié.');
    process.exit(0);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = `.rattrapage-backup/${stamp}`;
mkdirSync(backup, { recursive: true });
cpSync('src', `${backup}/src`, { recursive: true });
console.log(`💾 Sauvegarde de votre travail : ${backup}/src`);

try {
  try {
    git('remote', 'add', REMOTE, SOLUTIONS_URL);
  } catch {
    git('remote', 'set-url', REMOTE, SOLUTIONS_URL);
  }
  console.log(`⬇️  Téléchargement de la branche ${target}…`);
  git('fetch', REMOTE, `${target}:refs/remotes/${REMOTE}/${target}`);
  git('checkout', `${REMOTE}/${target}`, '--', 'src');
} catch (error) {
  fail(
    `Échec de la récupération : ${error.stderr?.toString().trim() || error.message}\n` +
      '   Vérifiez votre connexion. Si le dépôt répond « not found », la solution de cette étape n’est pas encore publiée : demandez à l’enseignant.\n' +
      `   Votre travail est sauvegardé dans ${backup}/src`,
  );
}

console.log(`✅ src/ est maintenant à l'état « ${target} ».`);
console.log('   Relancez les tests, par exemple : npm run ' + (step === 'bonus' ? 'test:bonus' : `test:etape${step}`));
console.log(`   Pour annuler : copiez ${backup}/src vers src/.`);
