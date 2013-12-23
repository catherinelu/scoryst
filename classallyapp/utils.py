# TODO: Should utils.py lie in the same directory as views.py and all?
import random
import string

def _generate_random_string(length):
  """ Generates a random string with the given length """
  possible_chars = string.ascii_letters + string.digits
  char_list = [random.choice(possible_chars) for i in range(length)]
  return ''.join(char_list)