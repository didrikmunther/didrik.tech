module.exports = (site, cb) => {
    const toArr = url => (url || '').split('/')
        .filter(v => !!v);

    site = site.map(v => ({
        ...v,
        activePage: v.url,
        isActivePage: url => toArr(url)[0] == toArr(v.url)[0],
        getDomainRedirect: domain => `//${domain ? `${domain}.` : ''}didrik.tech${v.url}`
    }));

    cb(null, site);
};