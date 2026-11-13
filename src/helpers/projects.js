const path = require('path');

const getYaml = require('../_helpers/getYalm');
const imageSize = require('../_helpers/imageSize');

const root = path.join(__dirname, '../..');

// Images are declared relative to the site root ('./static/...'); on disk they
// live next to the sources, so the build can read their real dimensions and
// render width and height attributes. That reserves the space before an image
// loads, which keeps the timeline from reflowing as the reader scrolls.
const withImageSize = project => {
    if (!project.img) return project;

    const { width, height } = imageSize(path.join(root, project.img.replace(/^\.\//, '')));

    return { ...project, imgWidth: width, imgHeight: height };
};

module.exports = async (site, cb) => {
    const { projects } = await getYaml('../data/projects.yaml');

    const sized = projects.map(withImageSize);

    site = site.map(v => ({
        ...v,
        projects: sized
    }));

    cb(null, site);
};
