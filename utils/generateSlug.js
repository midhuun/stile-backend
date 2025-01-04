const generateSlug = (name) =>{
    return name.trim().toLowerCase().replace(/\s+/g, '-');
}
module.exports = generateSlug