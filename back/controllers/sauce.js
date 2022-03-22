const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then((sauces) => {res.status(200).json(sauces)})
        .catch(error => res.status(400).json({ error }))
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            res.status(200).json(sauce);
        })
        .catch(error => res.status(400).json({error}))
};

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` 
    });
    sauce.save()
        .then(() => {
            res.status(201).json({
                message: 'Sauce created successfully !'
            });
        })
        .catch((error) => {
            res.status(400).json({ error });
        })
};

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ? 
        { 
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` 
        } : { ...req.body};
    Sauce.findOne({ _id: req.params.id})
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                .then(() => res.status(200).json({ message : 'Object upadated !' }))
                .catch(error => res.status(400).json({ error }))
            });
        })
        .catch(error => res.status(500).json({ error }))
};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if(!sauce){
                return res.status(404).json({ error: new Error(' Object not found !')});
            }
            if(sauce.userId !== req.auth.userId){
                return res.status(401).json({ error: new Error('unauthorized request')});
            }
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Object deleted !'}))
                    .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }))
    
    
};

exports.likeASauce = (req, res, next) => {
    const like = req.body.like;
    const idSauce = req.params.id;

    Sauce.findOne({ _id: idSauce})
        .then( sauce => {
            const notIncluded = !sauce.usersLiked.includes(req.body.userId) && !sauce.usersDisliked.includes(req.body.userId);
           
            //if liked
            if(like === 1 && notIncluded){
                Sauce.updateOne({ _id: idSauce }, {
                    $push: { usersLiked: req.body.userId },
                    $inc: { likes: +1 }
                })
                    .then(() => res.status(200).json({ message: 'Added Like !'}))
                    .catch(error => res.status(400).json({ error }));
            //if disliked
            } else if (like === -1 && notIncluded) {
                Sauce.updateOne({ _id: idSauce}, {
                    $push: { usersDisliked: req.body.userId },
                    $inc: { dislikes: +1 }
                })
                    .then(() => res.status(200).json({ message: 'Added Dislike !'}))
                    .catch(error => res.status(400).json({ error }));
            } else {
                if(sauce.usersLiked.includes(req.body.userId)){
                    Sauce.updateOne({ _id: idSauce }, {
                        $pull: { usersLiked: req.body.userId },
                        $inc: { likes: -1 }
                    })
                        .then(() => res.status(200).json({ message: 'like deleted !'}))
                        .catch(error => res.status(400).json({ error })); 
                } else if(sauce.usersDisliked.includes(req.body.userId)){
                    Sauce.updateOne({ _id: idSauce }, {
                        $pull: { usersDisliked: req.body.userId },
                        $inc: { dislikes: -1 } 
                    })
                        .then(() => res.status(200).json({ message: 'dislike deleted !'}))
                        .catch(error => res.status(400).json({ error })); 
                }
            }
            
        })
        .catch(error => res.status(400).json({ error }))
};