//
// Created by kmatu on 26.08.2025.
//

#ifndef MATRIX_CALC_MATRIX_H
#define MATRIX_CALC_MATRIX_H
#include <vector>
#include <cmath>
#include <iostream>
#include <stdexcept>
#include <algorithm>
#pragma once





using Matrix = std :: vector<std::vector<long double>>;

Matrix add(Matrix &a, Matrix &b) ;
Matrix sub(Matrix &a, Matrix &b) ;
Matrix multiply(Matrix &a, Matrix &b) ;
Matrix  multiply(Matrix &a, long double b) ;
Matrix transpose(Matrix &a) ;
Matrix inverse(Matrix &a) ;
Matrix identity(int n) ;
Matrix power(Matrix base, long long exp) ;
Matrix get_info(Matrix &A) ;

long double get_determinant(Matrix &A) ;
long double minor(Matrix &A) ;
int rank_matrix(Matrix &A);

bool is_valid(Matrix &A, Matrix &B) ;
void print_matrix(Matrix &a) ;


#endif //MATRIX_CALC_MATRIX_H
