var readBPMN = require('../readDiagram/readBPMN');
const createElement = require('../apiTrello/createProcess');
/**
 * @swagger
 * path:
 *  /generate:
 *    post:
 *      summary: Generate board Trello
 *      tags: [Trello]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - teamName
 *                - file
 *              properties:
 *                teamName:
 *                  type: string
 *                  description: Trello team name.
 *                file:
 *                  type: string
 *                  description: file(xml).
 *      responses:
 *        "201":
 *          description: Table generated (Trello)
 *        "500":
 *          description: Error (see description)
 */
exports.generate = (req, res) => {
    const { teamName, file, token, key } = req.body;
    if (!teamName || !file || !token || !key) {
        return res.status(400).json({
            error: 'Debe indicar el teamName, el fichero, el token y la key',
        })
    }

    readBPMN.getElementfromDiagram(file).then((data) => {
        var tasks = data.tasks;
        var boardName = data.boardName;
        var conditions = data.conditions;

        if (data.error){
            return res.status(400).json({
                error: data.error,
            });
        } 
        //Création du board
        return createElement.createBoard(boardName, teamName, token, key)
            .then((idBoard) => {
                return createElement.createList(idBoard, tasks, token, key, conditions)
                    .then((cond) => {
                        if (!(cond.length === 0)){
                            console.log("IN");
                            createElement.createConditions(idBoard, cond, token, key)
                                .then(() => {
                                    res.status(201).json({
                                        message: 'Board created',
                                    });
                                })
                                .catch((error) => {
                                    createElement.deleteBoard(idBoard, token, key);
                                    res.status(error.status).json({
                                        error: error.error,
                                        msg: error.msg
                                    });
                                });
                        } else {
                            res.status(201).json({
                                message: 'Board created',
                            });
                        }
                    })
                    .catch((error) => {
                        createElement.deleteBoard(idBoard, token, key);
                        res.status(error.status).json({
                            error: error.error,
                            msg: error.msg
                        });
                    });
            })
            .catch((error) => {
                res.status(error.status).json({
                    error: error.error,
                    msg: error.msg
                });
            });
    });
}