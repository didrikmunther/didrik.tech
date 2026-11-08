const getYaml = require('../_helpers/getYalm');

module.exports = async (site, cb) => {
    const { version } = await getYaml('../data/version.yaml');

    site = site.map(v => ({
        ...v,
		version,
		year: new Date().getFullYear()
    }));

    cb(null, site);
};