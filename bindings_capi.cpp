//
// Created by kmatu on 28.08.2025.
//
// bindings_capi.cpp — C API + cwrap вариант
// bindings_capi.cpp — C API для Emscripten + cwrap (без Embind)
// Экспортирует функции для работы с Matrix из JS как простые указатели/числа.
#include "matrix.h"

extern "C" {
// В operations.cpp есть определение, объявим здесь


Matrix* create_matrix(int rows, int cols) {
    return new Matrix(rows, std::vector<long double>(cols, 0.0L));
}
int rank_m(Matrix* a) { Matrix copy = *a; return ::rank_matrix(copy); }
void destroy_matrix(Matrix* m) { delete m; }
int  get_rows(Matrix* m)       { return (int)m->size(); }
int  get_cols(Matrix* m)       { return m->empty()? 0 : (int)(*m)[0].size(); }
void set_element(Matrix* m, int r, int c, double v) { (*m)[r][c] = (long double)v; }
double get_element(Matrix* m, int r, int c) { return (double)(*m)[r][c]; }

// --- Операции ---
Matrix* add_m(Matrix* a, Matrix* b) { return new Matrix(::add(*a, *b)); }
Matrix* sub_m(Matrix* a, Matrix* b) { return new Matrix(::sub(*a, *b)); }
Matrix* mul_m(Matrix* a, Matrix* b) { return new Matrix(::multiply(*a, *b)); }
Matrix* transpose_m(Matrix* a)      { return new Matrix(::transpose(*a)); }
double  det_m(Matrix* a)            { Matrix copy = *a; return (double)get_determinant(copy); }
Matrix* inv_m(Matrix* a)            { Matrix copy = *a; return new Matrix(::inverse(copy)); }

// Возведение в степень: A^exp (целая степень)
Matrix* power_m(Matrix* a, long long exp)   { return new Matrix(::power(*a, exp)); }
}
