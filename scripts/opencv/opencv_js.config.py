core = {
    '': [],
    'Algorithm': [],
}

imgproc = {
    '': ['cvtColor'],
}

features = {
    'Feature2D': ['detectAndCompute'],
    'ORB': ['create'],
    'DescriptorMatcher': ['knnMatch'],
    'BFMatcher': ['create'],
}

white_list = makeWhiteList([core, imgproc, features])
