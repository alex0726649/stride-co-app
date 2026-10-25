const path = require ('path');
const i18n = require ('i18n');

i18n.configure({
    locales:['es','en'],
    defaultLocale: 'es',
    directory:path.join(__dirname,'..','locales'),
    queryParameter:'lang',
    header:'accept-language',
    cookie:'lang',
    objectNotation: true //

});
module.exports=i18n;