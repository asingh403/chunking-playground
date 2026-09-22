import unittest
# pyrefly: ignore [missing-import]
import mongomock
from unittest.mock import patch
import sys
import os

# Add backend and backend/app to path
test_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(test_dir)
app_dir = os.path.join(backend_dir, "app")
for p in [app_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

import db

class TestMongoDBIngestion(unittest.TestCase):
    def setUp(self):
        self.mock_client = mongomock.MongoClient()
        # Patch get_mongo_client to return mock_client
        self.patcher = patch.object(db, 'get_mongo_client', return_value=self.mock_client)
        self.mock_get_client = self.patcher.start()

    def tearDown(self):
        self.patcher.stop()

    def test_resume_chunk_individual_document_storage_and_embeddings(self):
        """
        Verify that a resume with multiple chunks stores each chunk as a SEPARATE
        MongoDB document, with relevant metadata and 1,024-dimensional Mistral embeddings.
        """
        resume_chunks = [
            {
                "chunk_id": 1,
                "text": "Ashwin P - Automation QA Engineer with 3.3 years experience in Selenium, Java, and TestNG.",
                "char_count": 89,
                "start_char": 0,
                "end_char": 89
            },
            {
                "chunk_id": 2,
                "text": "Projects: Banking Application Project automating core banking workflows, Postman API testing, and SQL.",
                "char_count": 102,
                "start_char": 90,
                "end_char": 192
            },
            {
                "chunk_id": 3,
                "text": "Education: B.E Computer Science Engineering, Vel Tech High Tech Dr.RR & Dr.SD Engineering College.",
                "char_count": 98,
                "start_char": 193,
                "end_char": 291
            }
        ]

        candidate_metrics = {
            "name": "Ashwin P",
            "role": "Automation QA Engineer",
            "skills": ["Selenium", "Java", "TestNG", "Postman", "SQL"],
            "experience_years": 3.3
        }

        res = db.ingest_chunks_to_mongodb(
            source_type="resume",
            document_name="Ashwin_QA_Resume.pdf",
            strategy="recursive",
            chunks=resume_chunks,
            source_url=None,
            strategy_params={"chunk_size": 500, "chunk_overlap": 50},
            document_metrics=candidate_metrics
        )

        self.assertTrue(res["success"])
        self.assertEqual(res["collection"], "resume_chunks")
        self.assertEqual(res["chunk_count"], 3)
        self.assertEqual(res["source_type"], "resume")
        self.assertEqual(res["embedding_model"], "mistral-embed")
        self.assertEqual(res["embedding_dimensions"], 1024)
        self.assertTrue(res["vector_search_ready"])
        self.assertEqual(len(res["inserted_ids"]), 3)

        # Verify in MongoDB collection: each chunk MUST be an individual document
        collection = self.mock_client["chunking_playground"]["resume_chunks"]
        total_docs = collection.count_documents({})
        self.assertEqual(total_docs, 3, "Each chunk must be stored as a separate individual document")

        # Fetch and verify each chunk document
        stored_docs = list(collection.find().sort("chunk_index", 1))
        self.assertEqual(len(stored_docs), 3)

        for idx, doc in enumerate(stored_docs, 1):
            self.assertEqual(doc["document_name"], "Ashwin_QA_Resume.pdf")
            self.assertEqual(doc["source_type"], "resume")
            self.assertEqual(doc["strategy"], "recursive")
            self.assertEqual(doc["chunk_index"], idx)
            self.assertEqual(doc["total_chunks"], 3)
            self.assertIn("text", doc)
            self.assertIn("ingested_at", doc)
            
            # Verify metadata
            self.assertIn("metadata", doc)
            self.assertEqual(doc["metadata"]["name"], "Ashwin P")
            self.assertEqual(doc["metadata"]["role"], "Automation QA Engineer")
            
            # Verify 1,024-dimensional Mistral embedding
            self.assertIn("embedding", doc)
            self.assertEqual(len(doc["embedding"]), 1024, "Embedding must have exactly 1,024 dimensions")
            self.assertEqual(doc["embedding_dimensions"], 1024)
            self.assertEqual(doc["embedding_model"], "mistral-embed")

    def test_web_url_collection_routing_separate_docs(self):
        chunks = [
            {"chunk_id": 1, "text": "Confluence workspace page chunk 1", "char_count": 35},
            {"chunk_id": 2, "text": "Confluence workspace page chunk 2", "char_count": 35}
        ]
        res = db.ingest_chunks_to_mongodb(
            source_type="web_url",
            document_name="Confluence Architecture Overview",
            strategy="semantic",
            chunks=chunks,
            source_url="https://company.atlassian.net/wiki/spaces/ARCH/pages/123",
            strategy_params={"threshold": 0.8},
            document_metrics={"word_count": 50, "char_count": 300}
        )

        self.assertTrue(res["success"])
        self.assertEqual(res["collection"], "web_url_chunks")
        self.assertEqual(res["chunk_count"], 2)

        # Verify individual documents in web_url_chunks
        collection = self.mock_client["chunking_playground"]["web_url_chunks"]
        self.assertEqual(collection.count_documents({}), 2)
        
        doc1 = collection.find_one({"chunk_id": 1})
        self.assertIsNotNone(doc1)
        self.assertEqual(doc1["document_name"], "Confluence Architecture Overview")
        self.assertEqual(doc1["source_url"], "https://company.atlassian.net/wiki/spaces/ARCH/pages/123")
        self.assertEqual(len(doc1["embedding"]), 1024)

    def test_document_collection_routing_separate_docs(self):
        chunks = [
            {"chunk_id": 1, "text": "Employee Handbook page 1", "char_count": 25},
            {"chunk_id": 2, "text": "Employee Handbook page 2", "char_count": 25},
            {"chunk_id": 3, "text": "Employee Handbook page 3", "char_count": 25}
        ]
        res = db.ingest_chunks_to_mongodb(
            source_type="document",
            document_name="Employee_Handbook_2026.pdf",
            strategy="recursive",
            chunks=chunks,
            source_url=None,
            strategy_params={"chunk_size": 500, "chunk_overlap": 50},
            document_metrics={"word_count": 150, "char_count": 900}
        )

        self.assertTrue(res["success"])
        self.assertEqual(res["collection"], "document_chunks")
        self.assertEqual(res["chunk_count"], 3)

        # Verify in MongoDB collection
        collection = self.mock_client["chunking_playground"]["document_chunks"]
        self.assertEqual(collection.count_documents({}), 3)
        doc = collection.find_one()
        self.assertIsNotNone(doc)
        self.assertEqual(doc["document_name"], "Employee_Handbook_2026.pdf")
        self.assertEqual(len(doc["embedding"]), 1024)

    def test_vector_search_chunks(self):
        chunks = [
            {"chunk_id": 1, "text": "Python automation engineer with Selenium experience."},
            {"chunk_id": 2, "text": "Graphic designer specialized in Figma and UI/UX design."}
        ]
        db.ingest_chunks_to_mongodb(
            source_type="resume",
            document_name="Candidates.pdf",
            strategy="fixed",
            chunks=chunks
        )

        # Perform vector search for QA engineer
        search_res = db.vector_search_chunks(
            query="Selenium Python testing automation",
            source_type="resume",
            top_k=2
        )

        self.assertTrue(search_res["success"])
        self.assertGreater(len(search_res["chunks"]), 0)
        top_match = search_res["chunks"][0]
        self.assertIn("score", top_match)
        self.assertEqual(top_match["chunk_id"], 1)

    def test_check_mongo_connection_success(self):
        status = db.check_mongo_connection()
        self.assertTrue(status["connected"])
        self.assertEqual(status["database"], "chunking_playground")
        self.assertIn("counts", status)
        self.assertIn("resume_chunks", status["counts"])

if __name__ == "__main__":
    unittest.main()
