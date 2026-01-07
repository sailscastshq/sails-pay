/**
 * Common input definitions (i.e. parameter definitions) that are shared by multiple files.
 *
 * @type {Dictionary}
 * @constant
 */

module.exports = {
  PAGA_PUBLIC_KEY: {
    type: 'string',
    friendlyName: 'Public Key',
    description: 'A valid Paga Public Key',
    protect: true,
    whereToGet: {
      url: 'https://www.mypaga.com/paga-business/',
      description: 'Get your public key from the Paga Business dashboard.',
      extendedDescription:
        'To get your public key, log in to your Paga Business account and navigate to Settings → Developers → API Keys.'
    }
  }
}
