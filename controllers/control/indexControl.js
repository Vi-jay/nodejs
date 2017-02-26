const model = require('../../models/db/model');
let
    Pet = model.Pet,
    User = model.User;
let index = async(ctx, next) => {
        ctx.render('/login.html', {
            title: 'hello',
        });
    },
    home = async(ctx, next) => {
        let name = ctx.request.body.name;
        // let pet = await Pet.create({
        //     id: 'd-' + 1234,
        //     name: 'Odie',
        //     gender: false,
        //     birth: '2008-08-08',
        //     createdAt: 123,
        //     updatedAt: 123,
        //     version: 0});
        // console.log(pet);
        ctx.render('/chart.html',{
            name:name
        })
    };
module.exports = {
    'GET /': index,
    'POST /home': home
};