const modelMapper = (mode: 'HIGH' | 'MID', type: 'THINK' | 'DEV') => {
  if (mode === 'HIGH') {
    return type === 'THINK' ? 'o4-mini' : 'gpt-5-mini'
  }
  return type === 'THINK' ? 'gpt-5-mini' : 'gpt-4.1-mini'
}

export default modelMapper
