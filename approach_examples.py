import re


class Test:
    """Defines the expected behavior of a fixed set of formatting operations.
    Provides test data and testing functionality that can be used to validate
    formatting operations with or without a cursor.
    """

    commatize_data = [
            ('24875', 2, '24,875', 3),
            ('5,4990000', 9, '54,990,000', 10),
            (',1,,8,,,', 3, '18', 1)
    ]

    trim_data = [
            ('hello ', 6, 'hello', 5),
            ('   Hello,   friends.   ', 12, 'Hello,   friends. ', 9),
            ('   ', 1, '', 0)
    ]

    reduce_whitespace_data = [
            ('whirled    peas', 11, 'whirled peas', 8),
            ('    Hello  there.  Hi.  ', 17, ' Hello there. Hi. ', 13),
            ('    ', 4, ' ', 1)
    ]

    def __init__(self, formatter):
        """Takes an object that implements the formatting operations defined
        by our test data.
        """
        self.tests = [
                (formatter.commatize, self.commatize_data),
                (formatter.trim, self.trim_data),
                (formatter.reduce_whitespace, self.reduce_whitespace_data)
        ]

    def show_text(self, name, text, cursor=None):
        print('   %s: "%s"' % (name, text))
        if cursor != None:
            print('            ' + ((cursor - 1) * ' ') + '\xe2\x86\x97')

    def run_tests(self, with_cursor=False):
        success = True
        for operation, data in self.tests:
            for (original_text, original_cursor,
                    expected_text, expected_cursor) in data:
                if with_cursor:
                    received_text, received_cursor = operation(
                            original_text, original_cursor)
                else:
                    received_text = operation(original_text)
                    original_cursor = received_cursor = expected_cursor = None
                if received_text != expected_text or (with_cursor and
                        received_cursor != expected_cursor):
                    print('Failure:')
                    self.show_text('original', original_text, original_cursor)
                    self.show_text('received', received_text, received_cursor)
                    self.show_text('expected', expected_text, expected_cursor)
                    success = False
        if success:
            print('Tests passed.')
        return success


class FailFormatter:

    def commatize(self, s):
        return s

    def trim(self, s):
        return s

    def reduce_whitespace(self, s):
        return s


class Formatter:
    
    def commatize(self, s):
        """Takes a string of digits and commas. Adjusts commas
        so that they separate the digits into groups of three.
        """
        s = s.replace(',', '')
        start = len(s) % 3 or 3
        groups = [ s[:start] ]
        for i in range(start, len(s), 3):
            groups.append(s[i:i+3])
        return ','.join(groups)

    def trim(self, s):
        """Removes spaces from the beginning and end of the string.
        """
        return s.strip()

    def reduce_whitespace(self, s):
        return re.sub('\s+', ' ', s)


if __name__ == '__main__':
    Test(Formatter()).run_tests()
