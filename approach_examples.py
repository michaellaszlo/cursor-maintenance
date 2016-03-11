# -*- coding: utf-8 -*-

import re


class Test:
    """Describes the behavior of a fixed set of formatting operations.
    Provides test data and a test runner that can be used to verify
    the formatting operations with or without cursor positioning.
    """

    test_data = {
        'commatize': [
            ('2500', 1, '2,500', 1),
            ('12500', 3, '12,500', 4),
            ('5,4990000', 9, '54,990,000', 10),
            (',1,,8,,,', 3, '18', 1),
            ('1,0,0,000', 3, '100,000', 2),
            ('1,0,000', 2, '10,000', 1),
            ('1,,000', 2, '1,000', 1),
            ('1,00', 2, '100', 1),
            ('1234', 1, '1,234', 1),
            ('1,0234', 3, '10,234', 2),
            ('10,00', 4, '1,000', 4)
        ],
        'trimify': [
            ('  hello  ', 8, 'hello', 5),
            ('  hello  ', 1, 'hello', 0),
            ('Hello,  friends.', 7, 'Hello, friends.', 7),
            ('Hello,  friends.', 8, 'Hello, friends.', 7),
            ('  whirled    peas  now  ', 9, 'whirled peas now', 7),
            ('  whirled    peas  now  ', 10, 'whirled peas now', 8),
            ('  whirled    peas  now  ', 11, 'whirled peas now', 8),
            ('  whirled    peas  now  ', 12, 'whirled peas now', 8),
            ('  whirled    peas  now  ', 13, 'whirled peas now', 8),
            ('     ', 3, '', 0)
        ]
    }

    def __init__(self, formatter=None):
        """Takes an object that implements the formatting operations described
        by our test data.
        """
        self.formatter = formatter

    def show_text(self, label, text, cursor=None):
        """Prints out a single test string, optionally with cursor position.
        """
        prefix = '   %s: "' % label
        print('%s%s"' % (prefix, text))
        if cursor != None:
            print((len(prefix) + cursor) * ' ' + '↖ %d' % cursor)

    def display(self, name=None, show_cursor=True):
        """Prints out the test pairs for a specified formatting operation.
        """
        if name == None:
            print('')
            for name in self.test_data.keys():
                self.display(name, show_cursor)
            return
        print('Test cases for %s\n' % name)
        for (original_text, original_cursor,
                expected_text, expected_cursor) in self.test_data[name]:
            if not show_cursor:
                original_cursor, expected_cursor = None, None
            self.show_text('original', original_text, original_cursor)
            self.show_text('expected', expected_text, expected_cursor)
            print('')

    def run(self, name=None, with_cursor=True):
        """Tests the specified formatting operation.
        """
        if name == None:
            print('')
            for name in self.test_data.keys():
                self.run(name, with_cursor)
                print('')
            return
        print('Testing %s' % name)
        operation = getattr(self.formatter, name)
        passing = True
        for (original_text, original_cursor,
                expected_text, expected_cursor) in self.test_data[name]:
            received_text, received_cursor = operation(
                    original_text, original_cursor)
            if received_text != expected_text or (with_cursor and
                    received_cursor != expected_cursor):
                print('failed')
                self.show_text('original', original_text, original_cursor)
                self.show_text('expected', expected_text, expected_cursor)
                self.show_text('received', received_text, received_cursor)
                passing = False
        if passing:
            print('passed')
        return passing


def choose_cursor_char(s):
    used_chars = set(list(s))
    for char in '^|_#':
        if char not in used_chars:
            return char
    for code in range(32, 127):
        char = chr(code)
        if char not in used_chars:
            return char
    return None


class Formatter:
    """Implements the operations specified in the Test class without
    regard for cursor position.
    """
    
    def commatize(self, s, cursor=None):
        """Takes a string of digits and commas. Adjusts commas so that they
        separate the digits into groups of three.
        """
        s = s.replace(',', '')
        start = len(s) % 3 or 3
        groups = [ s[:start] ]
        for i in range(start, len(s), 3):
            groups.append(s[i:i+3])
        s = ','.join(groups)
        return (s, cursor)

    def trimify(self, s, cursor=None):
        """Removes spaces from the beginning and end of the string, and
        reduces each internal whitespace sequence to a single space.
        """
        s = s.strip()
        s = re.sub('\s+', ' ', s)
        return (s, cursor)


class NumericalCursorFormatter(Formatter):

    def commatize(self, s, cursor):
        offset_before = s[:cursor].count(',')
        left_digit_count = cursor - s[:cursor].count(',')
        s = Formatter.commatize(self, s)[0]
        if left_digit_count == 0:
            return (s, 0)
        for pos, ch in enumerate(s):
            if ch != ',':
                left_digit_count -= 1
                if left_digit_count == 0:
                    break
        cursor = pos + 1
        return (s, cursor)

    def trimify(self, s, cursor):
        left = s[:cursor]
        left_trimmed = Formatter.trimify(self, left + 'x')[0][:-1]
        left_whitespace_count = cursor - len(left_trimmed)
        s = Formatter.trimify(self, s)[0]
        cursor = min(len(s), cursor - left_whitespace_count)
        return (s, cursor)


class TextualCursorFormatter(Formatter):

    def commatize(self, s, cursor):
        cursor_char = choose_cursor_char(s)
        s = s[:cursor] + cursor_char + s[cursor:]
        groups = []
        group_chars = []
        digit_count = 0
        for ch in reversed(s):
            if ch != ',':
                group_chars.append(ch)
                if ch != cursor_char:
                    digit_count += 1
                    if digit_count == 3:
                        groups.append(''.join(reversed(group_chars)))
                        group_chars = []
                        digit_count = 0
        if group_chars != []:
            groups.append(''.join(reversed(group_chars)))
        s = ','.join(reversed(groups))
        cursor = s.index(cursor_char)
        s = s.replace(cursor_char, '')
        return (s, cursor)

    def trimify(self, s, cursor):
        cursor_char = choose_cursor_char(s)
        s = s[:cursor] + cursor_char + s[cursor:]
        s = Formatter.trimify(self, s)[0]
        s = s.replace(' ' + cursor_char + ' ', ' ' + cursor_char)
        if s[0] == cursor_char:
            s = s.replace(cursor_char + ' ', cursor_char)
        elif s[-1] == cursor_char:
            s = s.replace(' ' + cursor_char, cursor_char)
        cursor = s.index(cursor_char)
        s = s.replace(cursor_char, '')
        return (s, cursor)


class TextWithCursor:

    def __init__(self, text='', cursor=0):
        self.text = text
        self.cursor = cursor

    def read(self, begin, length=1):
        return self.text[begin : begin + length]

    def insert(self, begin, subtext):
        self.text = self.text[:begin] + subtext + self.text[begin:]
        if self.cursor > begin:
            self.cursor += len(subtext)

    def delete(self, begin, length=1):
        self.text = self.text[:begin] + self.text[begin + length : ]
        if self.cursor >= begin:
            self.cursor -= min(self.cursor - begin, length)

    def length(self):
        return len(self.text)

    def append(self, subtext):
        self.insert(self.length(), subtext)

    def display(self):
        print(self.text)
        print(self.cursor * ' ' + '↖')


class MetaCursorFormatter:

    def commatize(self, s, cursor):
        t = TextWithCursor(s, cursor)
        digit_count = 0
        for pos in reversed(range(t.length())):
            if t.read(pos) == ',':
                t.delete(pos)
            elif digit_count < 2:
                digit_count += 1
            elif pos > 0:
                t.insert(pos, ',')
                digit_count = 0
        return (t.text, t.cursor)

    def trimify(self, s, cursor):
        t = TextWithCursor(s, cursor)
        space_count = 0
        for pos in reversed(range(t.length())):
            if t.read(pos) != ' ':
                space_count = 0
            elif space_count == 0:
                space_count = 1
            else:
                t.delete(pos + 1)
        for pos in [ t.length() - 1, 0 ]:
            if t.read(pos) == ' ':
                t.delete(pos)
        return (t.text, t.cursor)


def levenshtein(s, t):
    n, m = len(s), len(t)
    if min(n, m) == 0:
        return max(n, m)
    current = list(range(m + 1))
    previous = (m + 1) * [ None ]
    for i in range(1, n + 1):
        current, previous = previous, current
        current[0] = previous[0] + 1
        for j in range(1, m + 1):
            if t[j - 1] == s[i - 1]:
                current[j] = previous[j - 1]
            else:
                current[j] = min(previous[j - 1] + 1,
                                 previous[j] + 1,
                                 current[j - 1] + 1)
    result = current[m]
    return result

def split_levenshtein(s, s_cursor, t, t_cursor):
    cursor_char = choose_cursor_char(s + t)
    left = levenshtein(s[:s_cursor], t[:t_cursor])
    right = levenshtein(s[s_cursor:], t[t_cursor:])
    result = left + right
    return result


def left_right_freqs(s, cursor, chars):
    freq_left = { ch: 0 for ch in chars }
    for ch in s[:cursor]:
        if ch in chars:
            freq_left[ch] += 1
    freq_right = { ch: 0 for ch in chars }
    for ch in s[cursor:]:
        if ch in chars:
            freq_right[ch] += 1
    return freq_left, freq_right

def balance_frequencies(s, s_cursor, t, t_cursor):
    chars = set(list(s)).intersection(set(list(t)))
    s_freq_left, s_freq_right = left_right_freqs(s, s_cursor, chars)
    t_freq_left, t_freq_right = left_right_freqs(t, t_cursor, chars)
    cost = 0
    for ch in chars:
        a = 1.0 * s_freq_left[ch] / (s_freq_left[ch] + s_freq_right[ch])
        b = 1.0 * t_freq_left[ch] / (t_freq_left[ch] + t_freq_right[ch])
        cost += abs(a - b) ** 2
    return cost


class RetrospectiveCursorFormatter(Formatter):

    def __init__(self, get_distance):
        self.get_distance = get_distance

    def recalculate_cursor(self, original, cursor, formatted):
        cursor_char = choose_cursor_char(original + formatted)
        get_distance = self.get_distance
        best_cost = get_distance(original, cursor, formatted, 0)
        best_pos = 0
        #print(original[:cursor] + '^' + original[cursor:])
        #print('  ^%s %d' % (formatted, best_cost))
        for pos in range(1, len(formatted) + 1):
            cost = get_distance(original, cursor, formatted, pos) 
            #print('  %s^%s %f' % (formatted[:pos], formatted[pos:], cost))
            if cost < best_cost:
                best_cost = cost
                best_pos = pos
        return best_pos

    def commatize(self, original, cursor):
        formatted = Formatter.commatize(self, original)[0]
        cursor = self.recalculate_cursor(original, cursor, formatted)
        return (formatted, cursor)

    def trimify(self, original, cursor):
        formatted = Formatter.trimify(self, original)[0]
        cursor = self.recalculate_cursor(original, cursor, formatted)
        return (formatted, cursor)


if __name__ == '__main__':
    #Test(NumericalCursorFormatter()).run()
    #Test(TextualCursorFormatter()).run()
    #Test(MetaCursorFormatter()).run()
    Test(RetrospectiveCursorFormatter(balance_frequencies)).display()

