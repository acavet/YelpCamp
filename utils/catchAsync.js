// async utility function to catch errors in our routing!
module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}