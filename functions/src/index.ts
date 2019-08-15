import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as firebaseHelper from 'firebase-functions-helper'
import * as express from 'express'
import * as bodyParser from 'body-parser'

admin.initializeApp(functions.config().firebase)
const db = admin.firestore()
const app = express()
const main = express()
const booksCollection = 'books'

main.use('/api/v1', app)
main.use(bodyParser.json())
main.use(bodyParser.urlencoded({ extended: false }))

export const webApi = functions.https.onRequest(main)

app.post('/books', async (req, res) => {
	try {
		const book: Book = mapToBook(req.body)
		const newDoc = await firebaseHelper.firestore.createNewDocument(
			db,
			booksCollection,
			book
		)
		res.status(201).send({ resourceId: newDoc.id })
	} catch (error) {
		res.status(400).send(`Book has incorrect properties.`)
	}
})

app.patch('/books/:bookId', async (req, res) => {
	const updatedDoc = await firebaseHelper.firestore.updateDocument(
		db,
		booksCollection,
		req.params.bookId,
		req.body
	)
	res.status(204).send(`Updated book: ${updatedDoc}`)
})

app.get('/books/:bookId', (req, res) => {
	firebaseHelper.firestore
		.getDocument(db, booksCollection, req.params.bookId)
		.then((doc: Book) =>
			res.status(200).send({ id: req.params.bookId, ...mapToBook(doc) })
		)
		.catch((error: any) => res.status(400).send(`Cannot get book: ${error}`))
})

app.get('/books', (req, res) => {
	firebaseHelper.firestore
		.backup(db, booksCollection)
		.then((data: any) => {
			const docs = data['books']
			const books: Book[] = []
			for (const key in docs) {
				books.push({ id: key, ...mapToBook(docs[key]) })
			}
			res.status(200).send(books)
		})
		.catch((error: any) => res.status(400).send(`Cannot get books: ${error}`))
})

app.delete('/books/:bookId', async (req, res) => {
	const deletedContact = await firebaseHelper.firestore.deleteDocument(
		db,
		booksCollection,
		req.params.bookId
	)
	res.status(204).send(`Book is deleted: ${deletedContact}`)
})

interface Book {
	id?: string
	name: string
	author: string
	isCheckedOut: boolean
	lastCheckedOutBy: string
	lastCheckedOutDate: number
}

const mapToBook = (body: any) => {
	const book: Book = {
		name: body['name'],
		author: body['author'],
		isCheckedOut: body['isCheckedOut'],
		lastCheckedOutBy: body['lastCheckedOutBy'],
		lastCheckedOutDate: body['lastCheckedOutDate']
	}
	return book
}
