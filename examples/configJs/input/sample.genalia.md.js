export default ({config: {title, author, year, random, content}}) => 
`${content}

# Genalia

${title} by ${author}
Year: ${year}

This is a random number: ${random}`