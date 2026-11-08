const getYaml = require('../_helpers/getYalm');

module.exports = async (site, cb) => {
    const { projects } = await getYaml('../data/projects.yaml');

    site = site.map(v => ({
        ...v,
        projects
    }));

    cb(null, site);
};
