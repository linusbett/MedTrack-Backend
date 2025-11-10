exports.getPosts = (req, res) => {
    res.json({ message: 'All posts' });
};

exports.singlePost = (req, res) => {
    res.json({ message: 'Single post' });
};

exports.createPost = (req, res) => {
    res.json({ message: 'Post created successfully' });
};

exports.updatePost = (req, res) => {
    res.json({ message: 'Post updated successfully' });
};

exports.deletePost = (req, res) => {
    res.json({ message: 'Post deleted successfully' });
};