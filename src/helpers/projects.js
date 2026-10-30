const showdown = require('showdown');
const getYaml = require('../_helpers/getYalm');

module.exports = async (site, cb) => {
	const { projects } = await getYaml('../data/projects.yaml');
    const { translation } = await getYaml('../data/translation.yaml');
	const converter = new showdown.Converter();

    site = site.map(v => ({
        ...v,
        projects: !translation.projects ? projects : projects.map(project => {
			const translated = translation.projects[project.id];

			if(!translated)
				return project;

			return {
				...project,
				title: translated.title || project.title,
				img: translated.img || project.img,
				text: translated.text || project.text,
				linkDescription: translated.linkDescription || project.linkDescription
			};
		})
    }));

    cb(null, site);
};
