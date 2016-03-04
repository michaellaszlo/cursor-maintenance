import re

def test(format, original, expected):
    formatted = format(original)
    if formatted != expected:
        print('failure:')
        print('   original: "%s"' % original)
        print('   expected: "%s"' % expected)
        print('  formatted: "%s"' % formatted)
        return False
    return True


class Formatter:
    
    commatize_test_pairs = [
            ('24875', '24,875'),
            ('5,4990000', '54,990,000'),
            (',1,8,,,', '18')
    ]
    
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

    trim_test_pairs = [
            ('hello ', 'hello'),
            ('   Hello,   friends.   ', 'Hello,   friends.'),
            ('   ', '')
    ]

    def trim(self, s):
        """Removes spaces from the beginning and end of the string.
        """
        return s.strip()

    reduce_whitespace_test_pairs = [
            ('whirled    peas', 'whirled peas'),
            ('    Hello  there.  Hi.  ', ' Hello there. Hi. '),
            ('    ', ' ')
    ]

    def reduce_whitespace(self, s):
        return re.sub('\s+', ' ', s)

    def test_all(self):
        success = True
        for test_pairs, format in [
                (self.commatize_test_pairs, self.commatize),
                (self.trim_test_pairs, self.trim),
                (self.reduce_whitespace_test_pairs, self.reduce_whitespace)]:
            for original, expected in test_pairs:
                if not test(format, original, expected):
                    success = False
        if success:
            print('tests succeeded')

Formatter().test_all()
