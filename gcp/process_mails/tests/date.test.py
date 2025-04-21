import unittest
from utils import convert_to_iso8601_utc, parse_mistral_response

class TestDateConverter(unittest.TestCase):
    def test_convert_to_iso8601_utc(self):
        # Test case 1: Normal date string with timezone
        date_str = "Wed, 24 Jul 2024 14:23:38 +0200"
        expected_iso = "2024-07-24T12:23:38Z"
        result = convert_to_iso8601_utc(date_str)
        self.assertEqual(result, expected_iso)

        # Test case 2: Date string with UTC timezone
        date_str = "Wed, 24 Jul 2024 12:23:38 +0000"
        expected_iso = "2024-07-24T12:23:38Z"
        result = convert_to_iso8601_utc(date_str)
        self.assertEqual(result, expected_iso)

        # Test case 3: Date string without explicit timezone (assuming UTC)
        date_str = "Wed, 24 Jul 2024 12:23:38"
        expected_iso = "2024-07-24T12:23:38Z"
        result = convert_to_iso8601_utc(date_str)
        self.assertEqual(result, expected_iso)
    
        # Test case 4: Invalid date string
        date_str = "Invalid Date"
        result = convert_to_iso8601_utc(date_str)
        self.assertIsNone(result)

        # Test case 5: Different timezone (PST)
        date_str = "Wed, 24 Jul 2024 05:23:38 -0700"
        expected_iso = "2024-07-24T12:23:38Z"
        result = convert_to_iso8601_utc(date_str)
        self.assertEqual(result, expected_iso)
        
class TestParseMistralResponse(unittest.TestCase):
    def test_parse_mistral_response(self):
        # Test case 1: Response with Work-Related
        result = '''
        {
            "category": "Work-Related",
            "summary": "Email notifies Charlie Apcher that they passed the interview for a Software Engineer position at Melify, and the next step is a technical interview."
        }
        '''
        expected_output = {"category": "Work-Related", "text": result, "summary": "Email notifies Charlie Apcher that they passed the interview for a Software Engineer position at Melify, and the next step is a technical interview."}
        self.assertEqual(parse_mistral_response(result), expected_output)
        
        # Test case where the category is exactly 'Promotions'
        result = '''
        {
            "category": "Promotions",
            "summary": "Email notifies Charlie Apcher that they passed the interview for a Software Engineer position at Melify, and the next step is a technical interview."
        }
        '''
        expected_output = {
            "category": "Notifications/Promotions",
            "text": result,
            "summary": "Email notifies Charlie Apcher that they passed the interview for a Software Engineer position at Melify, and the next step is a technical interview."
        }
        self.assertEqual(parse_mistral_response(result), expected_output)
        
       # Test case where the category is exactly 'Promotions'
        result = '''
        {
            "summary": "Email notifies Charlie Apcher that they passed the interview for a Software Engineer position at Melify, and the next step is a technical interview."
        }
        '''
        expected_output = {
            "category": "Other",
            "text": result,
            "summary": "Email notifies Charlie Apcher that they passed the interview for a Software Engineer position at Melify, and the next step is a technical interview."
        }
        self.assertEqual(parse_mistral_response(result), expected_output)

        # Test case 3: Invalid JSON input
        input_str = 'Invalid JSON String'
        expected_output = {
            "category": "Other",
            "text": input_str,
            "summary": ""
        }
        self.assertEqual(parse_mistral_response(input_str), expected_output)

if __name__ == '__main__':
    unittest.main()
