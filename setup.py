#!/usr/bin/env python
try:
    from setuptools import setup
except ImportError:
    from distutils.core import setup


setup(
    name='django-mptt-treechangelist',
    version='0.1.1',
    description='MPTT Tree Change List Django',
    long_description=open('README.rst').read(),
    url='https://github.com/blancltd/django-mptt-treechangelist',
    maintainer='Alex Tomkins',
    maintainer_email='alex@hawkz.com',
    platforms=['any'],
    install_requires=[
        'simplejson>=2.1.0',
    ],
    packages=[
        'mptt_treechangelist',
    ],
    package_data={'mptt_treechangelist': [
        'static/mptt_treechangelist/js/*',
        'templates/admin/*',
    ]},
    classifiers=[
        'Environment :: Web Environment',
        'Framework :: Django',
        'License :: OSI Approved :: BSD License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
    ],
    license='BSD-2',
)
