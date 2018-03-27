// Comandos de control. 

const Sequelize = require('sequelize');
const readline = require('readline');
// Importacion del módulo out.js
//const logerror = require("./out");
//const biglog = require("./out");
//const log = require("./out");
//const colorize = require("./out");
const {log, biglog, errorlog, colorize} = require('./out');


const {models} = require('./model');

/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.helpCmd = (socket,rl) => {
	log(socket,"Comandos:");
	log(socket," h|help - Muestra esta ayuda.");
	log(socket," list - Lista los quizzes existentes.");
	log(socket," show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
	log(socket," add - Añadir un nuevo quiz interactivamente.");
	log(socket," delete <id> - Borra el quiz indicado.");
	log(socket," edit <id> - Edita el quiz indicado.");
	log(socket," test <id> - Prueba el quiz indicado.");
	log(socket," p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
	log(socket," credits - Créditos.");
	log(socket,"q|quit - Salir del programa."); 
	rl.prompt();
};

/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */

exports.listCmd =(socket, rl) => {
models.quiz.findAll()
.each(quiz => {
     log(socket,`	[${colorize(quiz.id,'magenta')}]: ${quiz.question} `);
 })
 .catch(error => {
   errorlog(socket, error.message);
 })
 .then(() => {
   rl.prompt();
});
};

 /**
 * Esta función devuelve una promesa que:
 *	- Valida que se ha introducido un valor para el parámetro.
 *	- Convierte el parámetro en un número entero.
 * Si todo va bien, la promesa se satisface y devuelve el valor de id.
 *
 * @param id Parámetro con el índice a validar.
 */
const validateId = id => {
	return new Sequelize.Promise((resolve,reject) => {
    	if (typeof id === "undefined"){
    		reject(new Error(`Falta el parámetro <id>.`));
    	}else	{
    		id = parseInt(id);
    		if (Number.isNaN(id)){	// Coge la parte entera y descarta lo demás.
    			reject(new Error(`El valor del parámetro <id> no es un número.`));
       		}else	{
        		resolve(id);
       		}
    	}
   	});
};

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y
 *  la respuesta.
 *
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (socket,rl, id) => {
	validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
    	if (!quiz){
    		throw new Error(`No existe un quiz asociado al id=${id}.`);
    	}
    	log(socket, `	[${colorize(quiz.id,'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    })
    .catch(error => {
    	errorlog(socket, error.message);
    })
    .then(() => {
    	rl.prompt();
	});
};

 /**
 * Esta función convierte la llamada rl.question(basada en callbacks),
 *  en una basada en promesas.
 *
 * Devuelve una promesa, que cuando se cumple proporciona el texto introducido.
 * Entonces la llamada a then que hay que hacer la promesa devuelta sera:
 * 	.then(answe => {...})
 *
 * También colorea en rojo el texto de la pregunta, elimina espacios al principio 
 *  y al final.
 *
 * @param rl Obeto readline usado para implementar CLI.
 * @param text Pregunta que hay que hacerle al usuario.
 */
const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
    	rl.question(colorize(text, 'red'), answer => {
      		resolve(answer.trim());
    	});
  	});
};

/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 */
exports.addCmd = (socket,rl) => {
	makeQuestion(rl, ' Introduzca una pregunta: ')
 	.then(q => {
 	    return makeQuestion(rl, ' Introduzca la respuesta: ')
 	    .then(a => {
 	    	return {question: q, answer: a};
 	    });
 	  })
 	.then(quiz => {
 	   	return models.quiz.create(quiz);
 	})
 	.then((quiz) => {
 		log(socket, `	${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
 	})
 	.catch(Sequelize.ValidationError, error => {
 		errorlog(socket, 'El quiz es erróneo:');
 		error.errors.forEach(({message}) => errorlog(message));
 	})
 	.catch(error => {
 		errorlog(socket,error.message);
 	})
 	.then(() => {
 		rl.prompt();
	});
};

/**
 * Borra un quiz del modelo.
 *
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (socket,rl,id) => {
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
  		errorlog(socket, error.message);
	})
	.then(() => {
  		rl.prompt();
	});
};

/**
 * Edita un quiz del modelo
 *
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (socket,rl,id) => {
	validateId(id)
   	.then(id => models.quiz.findById(id))
   	.then(quiz => {
    	if (!quiz){
       		throw new Error(`No existe un quiz asociado al id=${id}.`);
     	}
    	process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
     	return makeQuestion(rl, ' Introduzca la pregunta: ')
     	.then(q => {
       		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
       		return makeQuestion(rl, 'Introduzca la respuesta ')
       		.then(r => {
         		quiz.question = q;
         		quiz.answer = r;
         		return quiz;
       		});
     	});
   	})
   	.then(quiz => {
    	return quiz.save();
   	})
   	.then(quiz => {
    	log(socket, `Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
   	})
    .catch(Sequelize.ValidationError, error => {
 		errorlog(socket,'El quiz es erróneo:');
 	    error.errors.forEach(({message}) => errorlog(message));
 	})
 	.catch(error => {
 		errorlog(socket, error.message);
 	})
 	.then(() => {
 		rl.prompt();
	});
};

/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la
 *  que debemos contestar.
 *
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (socket,rl,id) => {
	validateId(id)
   	.then(id => models.quiz.findById(id))
   	.then(quiz => {
    	if (!quiz){
       		throw new Error(`No existe un quiz asociado al id=${id}.`);
     	}
     	log(socket, `	[${colorize(quiz.id,'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} `);
     	return makeQuestion(rl, 'Introduzca la respuesta ')
     	.then(r => {
     		if(r.trim().toLowerCase() !== quiz.answer.trim().toLowerCase())  {
     			log(socket, `	${colorize('INCORRECTO', 'red')}`);
     		}else	{
     		log(socket,`	${colorize('CORRECTO', 'green')}`);
     		}
     	});
    })
    .catch(Sequelize.ValidationError, error => {
 	    errorlog(socket, 'El quiz es erróneo:');
 	    error.errors.forEach(({message}) => errorlog(message));
	})
    .catch(error => {
 		errorlog(socket, error.message);
 	})
 	.then(() => {
 		rl.prompt();
	});
};


/**
* Función auxiliar que realiza el desarrollo del juego.
*
* @param toBeResolved array con los quizzes que faltan por resolver
* @param score Puntuación del juego, se inicializa en 0.
*/
const playOne = (socket, rl,toBeResolved,score) => {
	return new Sequelize.Promise((resolve, reject) => {
    	if (toBeResolved.length === 0){
       		log(socket,`No hay nada más que preguntar. Fin del juego.`);
     		log(socket,'Tu puntuación es: ' );
     		biglog(socket,score, 'green');
     		resolve();
      		//resolve(answer.trim());
      	}else	{
      		let id = Math.floor(Math.random()*toBeResolved.length);
     		let quizaux = toBeResolved[id];
				makeQuestion(rl, colorize(quizaux.question + '? ', 'red')) 
				.then(r => {
     			if(r.trim().toLowerCase() !== quizaux.answer.trim().toLowerCase())  {
     				log(socket,`	${colorize('INCORRECTO', 'red')}`);
     				log(socket,`Fin del juego. Aciertos: ${score}`);
     	 			biglog(socket,score, 'green');
     	 			resolve();
     			}else	{
     				log(socket,`	${colorize('CORRECTO', 'green')}`);
     				score = score + 1;
     				log(socket,`CORRECTO - Lleva ${score} aciertos.`);
     				toBeResolved.splice(id,1);
     				resolve(playOne(socket,rl,toBeResolved,score)) 
     			}
     		})
     	}
	}); 	
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden
 *  aleatroio.
 * Se gana si se contesta a todos satisfactoriamente.
 */
exports.playCmd = (socket,rl) => {

	let score = 0;
	let toBeResolved = []; 
	models.quiz.findAll({raw: true})
	.then(quizzes => {
    	toBeResolved = quizzes;
 	})

	.then(() => {
		return playOne(rl,toBeResolved,score);
	})
	.catch(Sequelize.ValidationError, error => {
 	    errorlog(socket,'El quiz es erróneo:');
 	    error.errors.forEach(({message}) => errorlog(message));
	})
 	.catch(error => {
   	errorlog(socket,error.message);
 	})
 	.then(() => {
   		rl.prompt();
   	});
};

/**
 * Muestra los nombres de los autores de la práctica.
 */
exports.creditsCmd = (socket,rl) =>{
	log(socket,'Autor de la práctica.');
	log(socket,'Ignacio de las Heras Pinto.','green');
	rl.prompt();
};

/**
 * Terminar el programa.
 */
exports.quitCmd = (socket,rl)=>{
	rl.close();
  socket.end();
};
